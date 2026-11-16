"""RunPod render farm for the studio: one CPU pod, kept between episodes (stopped, not deleted), and renders that
resume where they stopped.

python tools/runpod.py up                 find the pod "ya-serisi-render" (start it if stopped, create it if missing), install what's missing
python tools/runpod.py render <slug> [<slug> ...] [--stop]
                                          upload the studio, render each episode in chunks on the pod, download
                                          out/<slug>/<slug>-raw.mp4; --stop stops the pod after the last one
python tools/runpod.py status             pod state and the render's progress
python tools/runpod.py stop               stop the pod (compute released, nothing deleted)

Key: RUNPOD_API_KEY in the environment, or the file named by RUNPOD_KEY_FILE (default ~/.secrets/runpod). Never in the repo.

Resume, three layers:
- the pod is reused by name: `up` starts the stopped pod instead of creating a new one;
- setup is idempotent: tools and node_modules are only installed when missing;
- the render is cut into chunks of frames. Each finished chunk is downloaded at once into studio/out/<slug>/chunks/,
  so a render interrupted by a stopped pod, a crash or a closed session continues from the next missing chunk, on
  this pod or a new one. Chunks are tied to a hash of the episode's source: change a shot and they render again.
"""
import base64, hashlib, io, json, os, pathlib, subprocess, sys, tarfile, time, urllib.request, urllib.error

API = 'https://api.runpod.io/v2'
NAME = 'ya-serisi-render'
ROOT = pathlib.Path(__file__).resolve().parent.parent
STUDIO = ROOT / 'studio'
STATE = pathlib.Path(os.environ.get('RUNPOD_STATE', pathlib.Path.home() / '.secrets' / 'runpod_state.json'))
CHUNK = 150


def key():
    if os.environ.get('RUNPOD_API_KEY'):
        return os.environ['RUNPOD_API_KEY']
    return pathlib.Path(os.environ.get('RUNPOD_KEY_FILE', pathlib.Path.home() / '.secrets' / 'runpod')).read_text().strip()


def curl(args, data=None, timeout=60):
    r = subprocess.run(['curl', '-sS', '--max-time', str(timeout), *args], input=data, capture_output=True)
    if r.returncode:
        raise RuntimeError(r.stderr.decode()[:300])
    return r.stdout


def api(method, path, body=None, timeout=60):
    args = ['-X', method, '-H', f'Authorization: Bearer {key()}', '-H', 'Content-Type: application/json', API + path]
    if body is not None:
        args += ['-d', json.dumps(body)]
    out = curl(args, timeout=timeout)
    return json.loads(out) if out.strip() else {}


def state():
    return json.loads(STATE.read_text()) if STATE.exists() else {}


def save_state(s):
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(s))
    os.chmod(STATE, 0o600)


def find_pod():
    for p in api('GET', '/pods').get('pods', []):
        if p['name'] == NAME:
            return p
    return None


AGENT = r"""
import http.server, json, os, subprocess
TOKEN = os.environ["XFER_TOKEN"]
W = "/workspace"
os.makedirs(W + "/xfer", exist_ok=True); os.makedirs(W + "/logs", exist_ok=True)
class H(http.server.BaseHTTPRequestHandler):
    def ok(self):
        if self.headers.get("X-Token") == TOKEN: return True
        self.send_response(403); self.end_headers(); return False
    def body(self):
        n = int(self.headers.get("Content-Length", 0)); return self.rfile.read(n)
    def out(self, code, data=b""):
        self.send_response(code); self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
    def do_PUT(self):
        if not self.ok(): return
        p = W + "/xfer/" + os.path.basename(self.path); n = int(self.headers.get("Content-Length", 0))
        with open(p, "wb") as f:
            while n > 0:
                b = self.rfile.read(min(n, 1 << 20)); f.write(b); n -= len(b)
        self.out(201)
    def do_POST(self):
        if not self.ok(): return
        j = json.loads(self.body()); name = os.path.basename(j["name"])
        try: os.remove(f"{W}/logs/{name}.done")
        except FileNotFoundError: pass
        log = open(f"{W}/logs/{name}.log", "wb")
        subprocess.Popen(["bash", "-c", j["cmd"].strip() + f"\necho $? > {W}/logs/{name}.done"], stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        self.out(202)
    def do_GET(self):
        if not self.ok(): return
        kind, _, name = self.path.strip("/").partition("/"); name = os.path.basename(name)
        if kind == "log":
            done = open(f"{W}/logs/{name}.done").read().strip() if os.path.exists(f"{W}/logs/{name}.done") else ""
            log = open(f"{W}/logs/{name}.log", "rb").read()[-6000:].decode("utf-8", "ignore") if os.path.exists(f"{W}/logs/{name}.log") else ""
            return self.out(200, json.dumps({"done": done, "log": log}).encode())
        p = W + "/xfer/" + name
        if not os.path.exists(p): return self.out(404)
        self.send_response(200); self.send_header("Content-Length", str(os.path.getsize(p))); self.end_headers()
        with open(p, "rb") as f:
            while True:
                b = f.read(1 << 20)
                if not b: break
                self.wfile.write(b)
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(("0.0.0.0", 8000), H).serve_forever()
"""

# The key in use may only manage pods (no exec permission), so the pod boots its own small agent: an HTTP server on
# port 8000, reached through RunPod's HTTPS proxy and guarded by a random token, that takes files and runs commands.
# If the agent dies, a plain file server takes its place on the same port, so /agent.err can be read from outside.
BOOT = 'mkdir -p /workspace; echo "$AGENT_B64" | base64 -d > /workspace/agent.py; python3 /workspace/agent.py 2> /workspace/agent.err; exec python3 -m http.server 8000 --directory /workspace'

SETUP = """set -e
if ! command -v ffmpeg >/dev/null; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 libdbus-1-3 libatspi2.0-0 > /dev/null
fi
echo setup-ok
"""


def agent(pid, token, method, path, data=None, timeout=120):
    args = ['-X', method, '-H', f'X-Token: {token}', f'https://{pid}-8000.proxy.runpod.net/{path}', '-w', '\n%{http_code}']
    if data is not None:
        args += ['--data-binary', '@-']
    out = curl(args, data=data, timeout=timeout)
    body, _, code = out.rpartition(b'\n')
    return int(code or 0), body


def run(pid, token, name, cmd):
    for _ in range(8):  # the proxy can answer 404/520 for a few seconds after the pod comes up
        code, _ = agent(pid, token, 'POST', 'run', json.dumps({'name': name, 'cmd': '( ' + cmd.strip() + '\n)'}).encode())
        if code == 202:
            return
        time.sleep(5)
    raise SystemExit(f'agent refused the job ({code})')


def poll(pid, token, name):
    try:
        code, body = agent(pid, token, 'GET', f'log/{name}')
        return json.loads(body) if code == 200 else {'done': '', 'log': ''}
    except Exception:  # a dropped connection is not the end of the job: ask again
        return {'done': '', 'log': ''}


def wait(pid, token, name, every=6, limit=3600, each=None):
    t0, last = time.time(), ''
    while time.time() - t0 < limit:
        r = poll(pid, token, name)
        tail = r['log'].strip().splitlines()[-1:] or ['']
        if tail[0] != last:
            last = tail[0]
            print('  ', last[-150:], flush=True)
        if each:
            each(r['log'])
        if r['done']:
            return int(r['done']), r['log']
        time.sleep(every)
    raise TimeoutError(name)


# Data centres to try, in order (None lets RunPod choose). A pod that is created but whose container never comes up
# (seen on 16 Nov 2026 in EUR-IS-1: status RUNNING, no runtime, then EXITED) is deleted and the next one is tried.
DATACENTERS = [d or None for d in os.environ.get('RUNPOD_DATACENTERS', 'EU-RO-1,,EU-SE-1,US-KS-2,CA-MTL-1').split(',')]


def create_pod(token, dc=None):
    body = {'name': NAME, 'cpu': {'id': 'cpu5c', 'vcpuCount': 32}, 'image': 'node:22-bookworm', 'entrypoint': ['/bin/bash', '-c'], 'cmd': [BOOT],
            'env': {'XFER_TOKEN': token, 'AGENT_B64': base64.b64encode(AGENT.encode()).decode()}, 'disk': 30, 'ports': ['8000/http']}
    if dc:
        body['dataCenterIds'] = [dc]
    pod = api('POST', '/pods', body)
    if 'id' not in pod:
        print(f'  no pod in {dc or "any data centre"}: ' + str(pod.get('detail', pod))[:160])
        return None
    print('created pod', pod['id'], 'in', pod.get('dataCenterId'), f"(${pod.get('cost')}/h)")
    return pod


def answers(pid, token, limit):
    t0 = time.time()
    while time.time() - t0 < limit:
        try:
            code, _ = agent(pid, token, 'GET', 'log/setup', timeout=12)
        except RuntimeError:
            code = 0
        if code == 200:
            return True
        time.sleep(5)
    return False


def up():
    s = state()
    token = s.get('token') or base64.urlsafe_b64encode(os.urandom(24)).decode()
    pod = find_pod()
    if pod is not None and pod.get('status') == 'RUNNING' and answers(pod['id'], token, 20):
        pid = pod['id']
    else:
        if pod is not None:
            # a stopped CPU pod stays tied to its host and may never come back; its disk holds nothing we need
            # (finished chunks are downloaded as they render), so it is replaced, not restarted
            api('DELETE', f"/pods/{pod['id']}")
            print('replaced the old pod', pod['id'])
        pid = None
        for dc in DATACENTERS:
            pod = create_pod(token, dc)
            if pod is None:
                continue
            save_state({'pod': pod['id'], 'token': token})
            if answers(pod['id'], token, 240):
                pid = pod['id']
                break
            print('  its container did not come up in 4 minutes: deleting it')
            api('DELETE', f"/pods/{pod['id']}")
        if pid is None:
            raise SystemExit('no pod could be started in any data centre')
    save_state({'pod': pid, 'token': token})
    run(pid, token, 'setup', SETUP)
    code, log = wait(pid, token, 'setup', limit=900)
    if code:
        raise SystemExit('setup failed:\n' + log[-1500:])
    print('pod ready', pid)
    return pid, token


def url(pid, name):
    return f'https://{pid}-8000.proxy.runpod.net/{name}'


def _silence():
    import struct
    n = 4410
    return b'RIFF' + struct.pack('<I', 36 + n * 2) + b'WAVEfmt ' + struct.pack('<IHHIIHH', 16, 1, 1, 44100, 88200, 2, 16) + b'data' + struct.pack('<I', n * 2) + b'\0' * (n * 2)


SILENCE = _silence()


def pack():
    """The studio as a tarball (no node_modules, no out), and a hash of what a render depends on."""
    buf = io.BytesIO()
    h = hashlib.sha1()
    with tarfile.open(fileobj=buf, mode='w:gz') as tar:
        for p in sorted(STUDIO.rglob('*')):
            rel = p.relative_to(STUDIO)
            if rel.parts[0] in ('node_modules', 'out', 'library') or p.is_dir() or p.is_symlink() or p.suffix in ('.pyc', '.mp3'):
                continue
            if p.suffix == '.wav':  # the picture is rendered muted, but the renderer still fetches the files: send a short silence
                info = tarfile.TarInfo(str(rel))
                info.size = len(SILENCE)
                tar.addfile(info, io.BytesIO(SILENCE))
                continue
            tar.add(p, arcname=str(rel))
            # the picture is rendered muted, so sound files don't count: a new mix never forces a new render
            if (rel.parts[0] in ('src', 'public') and p.suffix not in ('.wav', '.mp3')) or rel.name in ('package.json', 'package-lock.json'):
                raw = p.read_bytes()
                if rel.name in ('timeline.json', 'episode.json'):  # the sound plan and the mix volumes don't change a frame
                    j = json.loads(raw)
                    for k in ('audio', 'sound', 'duck', 'sfx_lu', 'music_lu'):
                        j.pop(k, None)
                    raw = json.dumps(j, sort_keys=True).encode()
                h.update(str(rel).encode()); h.update(raw)
    return buf.getvalue(), h.hexdigest()[:12]


RENDER = r'''
import os, subprocess, sys
slug, comp = sys.argv[1], sys.argv[2]
os.chdir("/workspace/studio")
for rng in sys.argv[3:]:
    a, b = rng.split("-")
    out = f"/workspace/xfer/{slug}-c{int(a):05d}-{int(b):05d}.mp4"
    entry = "/workspace/bundle" if os.path.exists("/workspace/bundle/index.html") else "src/index.ts"
    subprocess.run(["npx", "remotion", "render", entry, comp, "/tmp/part.mp4", f"--frames={int(a)}-{int(b)}", "--muted", "--concurrency=30", "--log=error"], check=True)
    os.replace("/tmp/part.mp4", out)
    print("chunk-done", os.path.basename(out), flush=True)
print("render-done", flush=True)
'''


def finish(slug, tl, ranges):
    """Join an episode's chunks and mix its sound onto the picture."""
    out = STUDIO / 'out' / slug
    cd = out / 'chunks'
    name = lambda a, b: f'{slug}-c{a:05d}-{b:05d}.mp4'
    (cd / 'list.txt').write_text(''.join(f"file '{(cd / name(a, b)).resolve()}'\n" for a, b in ranges))
    video = out / f'{slug}-video.mp4'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(cd / 'list.txt'), '-c', 'copy', str(video)], check=True)
    A = tl['audio']
    ins, flt, n = [], [], 0
    for k in ('voice', 'sfx', 'music'):
        if A.get(k):
            ins += ['-i', str(STUDIO / 'public' / A[k])]
            flt.append(f'[{n + 1}:a]volume={A.get(k + "Vol", 1)}[a{n}]')
            n += 1
    mix = ';'.join(flt) + ';' + ''.join(f'[a{i}]' for i in range(n)) + f'amix=inputs={n}:normalize=0[m]'
    raw = out / f'{slug}-raw.mp4'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(video), *ins, '-filter_complex', mix, '-map', '0:v', '-map', '[m]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
                    '-t', str(tl['total'] / tl['fps']), str(raw)], check=True)
    print('wrote', raw, flush=True)


def render_all(slugs, chunk=300):
    """Every episode in one go: the studio is uploaded and bundled once, then each episode's missing chunks are
    rendered one after another; each chunk is downloaded as it finishes and each episode is joined as it completes."""
    data, sig = pack()
    jobs = {}
    for slug in slugs:
        ep = json.loads((STUDIO / 'src/episodes' / slug / 'episode.json').read_text(encoding='utf-8'))
        tl = json.loads((STUDIO / 'src/episodes' / slug / 'timeline.json').read_text(encoding='utf-8'))
        cd = STUDIO / 'out' / slug / 'chunks'
        cd.mkdir(parents=True, exist_ok=True)
        if not ((cd / 'sig').exists() and (cd / 'sig').read_text() == sig + f'/{chunk}'):
            if '--keep' not in sys.argv:  # --keep: trust the chunks already here (the picture has not changed)
                for f in cd.glob('*'):
                    f.unlink()
            (cd / 'sig').write_text(sig + f'/{chunk}')
        total = tl['total']
        ranges = [(a, min(total, a + chunk) - 1) for a in range(0, total, chunk)]
        missing = [(a, b) for a, b in ranges if not (cd / f'{slug}-c{a:05d}-{b:05d}.mp4').exists()]
        jobs[slug] = (ep['id'], tl, ranges, missing)
    todo = [s for s in slugs if jobs[s][3]]
    print(f'{len(slugs)} episodes, {len(todo)} with chunks to render ({sum(len(jobs[s][3]) for s in todo)} chunks)', flush=True)
    done = set()

    def complete(slug):
        _, tl, ranges, _ = jobs[slug]
        cd = STUDIO / 'out' / slug / 'chunks'
        if slug not in done and all((cd / f'{slug}-c{a:05d}-{b:05d}.mp4').exists() for a, b in ranges):
            try:
                finish(slug, tl, ranges)
                done.add(slug)
            except Exception as e:
                print(f'{slug}: could not be joined ({e})', flush=True)

    for s in slugs:
        complete(s)
    if todo:
        pid, token = up()
        cmd = ('set -e; mkdir -p /workspace/studio && cd /workspace/studio && find . -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} + '
               '&& tar xzf /workspace/xfer/studio.tgz && (cmp -s package-lock.json node_modules/.lock 2>/dev/null || (npm ci --no-audit --no-fund --silent && cp package-lock.json node_modules/.lock)) '
               '&& rm -rf /workspace/bundle && npx remotion bundle src/index.ts --out-dir /workspace/bundle --log=error && echo bundled\nset +e\n')
        for s in todo:
            cmd += f'python3 /workspace/xfer/render_chunks.py {s} {jobs[s][0]} ' + ' '.join(f'{a}-{b}' for a, b in jobs[s][3]) + f' || echo "episode-failed {s}"\n'
        cmd += 'true'
        t0 = time.time()
        got = set()

        def fetch(log):
            for line in log.splitlines():
                if line.startswith('chunk-done '):
                    f = line.split()[1]
                    slug = f.rsplit('-c', 1)[0]
                    cd = STUDIO / 'out' / slug / 'chunks'
                    if f not in got and not (cd / f).exists():
                        try:
                            c, body = agent(pid, token, 'GET', f'f/{f}', timeout=600)
                        except Exception:
                            c, body = 0, b''
                        if c == 200 and body:
                            (cd / f).write_bytes(body)
                            print(f'   got {f}  ({time.time() - t0:.0f} s)', flush=True)
                            got.add(f)
                            complete(slug)
                    else:
                        got.add(f)

        r = poll(pid, token, 'render')
        if r['log'] and not r['done'] and '--restart' not in sys.argv:
            # a render started by an earlier, interrupted run is still going on the pod: collect what it has finished
            # and follow it instead of starting over
            print('a render is already running on the pod: following it', flush=True)
            for s2 in todo:
                for a, b in jobs[s2][3]:
                    f2 = f'{s2}-c{a:05d}-{b:05d}.mp4'
                    try:
                        c, body = agent(pid, token, 'GET', f'f/{f2}', timeout=600)
                    except Exception:
                        continue
                    if c == 200 and body:
                        (STUDIO / 'out' / s2 / 'chunks' / f2).write_bytes(body)
                        got.add(f2)
                        complete(s2)
        else:
            print(f'uploading studio ({len(data) / 1e6:.1f} MB, source {sig})', flush=True)
            code, _ = agent(pid, token, 'PUT', 'studio.tgz', data, timeout=900)
            code2, _ = agent(pid, token, 'PUT', 'render_chunks.py', RENDER.encode())
            if code != 201 or code2 != 201:
                raise SystemExit(f'upload failed ({code}, {code2})')
            run(pid, token, 'render', cmd)
        code, log = wait(pid, token, 'render', every=6, limit=4 * 3600, each=fetch)
        fetch(log)
        print(f'pod job ended after {time.time() - t0:.0f} s (exit {code})', flush=True)
        bad = [ln for ln in log.splitlines() if ln.startswith('episode-failed')]
        if code or bad:
            print('\n'.join(bad) + '\n' + log[-1500:], flush=True)
    left = [s for s in slugs if s not in done]
    if left:
        raise SystemExit('not complete: ' + ', '.join(left) + ' (run the same command again: finished chunks are kept)')
    print('all rendered', flush=True)


def render(slug):
    ep = json.loads((STUDIO / 'src/episodes' / slug / 'episode.json').read_text(encoding='utf-8'))
    tl = json.loads((STUDIO / 'src/episodes' / slug / 'timeline.json').read_text(encoding='utf-8'))
    data, sig = pack()
    out = STUDIO / 'out' / slug
    cd = out / 'chunks'
    cd.mkdir(parents=True, exist_ok=True)
    if not ((cd / 'sig').exists() and (cd / 'sig').read_text() == sig):
        for f in cd.glob('*'):
            f.unlink()  # the source changed: the old chunks no longer match
        (cd / 'sig').write_text(sig)
    total = tl['total']
    ranges = [(a, min(total, a + CHUNK) - 1) for a in range(0, total, CHUNK)]
    name = lambda a, b: f'{slug}-c{a:05d}-{b:05d}.mp4'
    missing = [(a, b) for a, b in ranges if not (cd / name(a, b)).exists()]
    print(f'{len(ranges)} chunks, {len(ranges) - len(missing)} already rendered, {len(missing)} to render')
    if missing:
        pid, token = up()
        print(f'uploading studio ({len(data) / 1e6:.1f} MB, source {sig})')
        code, _ = agent(pid, token, 'PUT', 'studio.tgz', data, timeout=900)
        code2, _ = agent(pid, token, 'PUT', 'render_chunks.py', RENDER.encode())
        if code != 201 or code2 != 201:
            raise SystemExit(f'upload failed ({code}, {code2})')
        prep = ('set -e; mkdir -p /workspace/studio && cd /workspace/studio && find . -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} + '
                '&& tar xzf /workspace/xfer/studio.tgz && (cmp -s package-lock.json node_modules/.lock 2>/dev/null || (npm ci --no-audit --no-fund --silent && cp package-lock.json node_modules/.lock)) '
                f'&& python3 /workspace/xfer/render_chunks.py {slug} {ep["id"]} ' + ' '.join(f'{a}-{b}' for a, b in missing))
        t0 = time.time()
        got = set()

        def fetch(log):
            for line in log.splitlines():
                if line.startswith('chunk-done '):
                    f = line.split()[1]
                    if f not in got and not (cd / f).exists():
                        c, body = agent(pid, token, 'GET', f'f/{f}', timeout=600)
                        if c == 200 and body:
                            (cd / f).write_bytes(body)
                            print('   got', f, flush=True)
                    got.add(f)

        run(pid, token, 'render', prep)
        code, log = wait(pid, token, 'render', every=5, limit=7200, each=fetch)
        fetch(log)
        if code:
            raise SystemExit('render failed:\n' + log[-2000:])
        print(f'rendered on the pod in {time.time() - t0:.0f} s')
    still = [n for n in (name(a, b) for a, b in ranges) if not (cd / n).exists()]
    if still:
        raise SystemExit(f'missing chunks: {still}')
    (cd / 'list.txt').write_text(''.join(f"file '{(cd / name(a, b)).resolve()}'\n" for a, b in ranges))
    video = out / f'{slug}-video.mp4'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(cd / 'list.txt'), '-c', 'copy', str(video)], check=True)
    # the sound is mixed here from the three stems at the volumes sfx.py set, then muxed onto the picture
    A = tl['audio']
    ins, flt, n = [], [], 0
    for k in ('voice', 'sfx', 'music'):
        if A.get(k):
            ins += ['-i', str(STUDIO / 'public' / A[k])]
            flt.append(f'[{n + 1}:a]volume={A.get(k + "Vol", 1)}[a{n}]')
            n += 1
    mix = ';'.join(flt) + ';' + ''.join(f'[a{i}]' for i in range(n)) + f'amix=inputs={n}:normalize=0[m]'
    raw = out / f'{slug}-raw.mp4'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(video), *ins, '-filter_complex', mix, '-map', '0:v', '-map', '[m]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
                    '-t', str(tl['total'] / tl['fps']), str(raw)], check=True)
    print('wrote', raw)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'status'
    if cmd == 'up':
        up()
    elif cmd == 'render':
        # one pod session for any number of episodes: python tools/runpod.py render bolum-01 bolum-02 ... [--stop]
        slugs = [a for a in sys.argv[2:] if not a.startswith('--')]
        failed = []
        for slug in slugs:
            try:
                render(slug)
            except SystemExit as e:
                failed.append(slug)
                print(f'{slug}: {e}')
        if '--stop' in sys.argv:
            p = find_pod()
            if p:
                print('pod', api('POST', f"/pods/{p['id']}/action", {'action': 'stop'}).get('status', 'stopping'))
        if failed:
            raise SystemExit('not rendered: ' + ', '.join(failed) + ' (run the same command again: finished chunks are kept)')
    elif cmd == 'renderall':
        try:
            render_all([a for a in sys.argv[2:] if not a.startswith('--')])
        finally:
            if '--terminate' in sys.argv:
                p = find_pod()
                if p:
                    api('DELETE', f"/pods/{p['id']}")
                    print('terminated', p['id'], flush=True)
    elif cmd == 'mix':
        # join and mix again from the chunks already here (after a change to the sound only)
        for slug in sys.argv[2:]:
            tl = json.loads((STUDIO / 'src/episodes' / slug / 'timeline.json').read_text(encoding='utf-8'))
            cd = STUDIO / 'out' / slug / 'chunks'
            parts = sorted(p.name for p in cd.glob(f'{slug}-c*.mp4'))
            ranges = [tuple(int(x) for x in n[len(slug) + 2:-4].split('-')) for n in parts]
            if not ranges or ranges[-1][1] != tl['total'] - 1:
                print(slug, 'chunks incomplete or the timeline changed length: render it again')
                continue
            finish(slug, tl, ranges)
    elif cmd == 'terminate':
        p = find_pod()
        if p:
            api('DELETE', f"/pods/{p['id']}")
            print('terminated', p['id'])
    elif cmd == 'stop':
        p = find_pod()
        if p:
            print(api('POST', f"/pods/{p['id']}/action", {'action': 'stop'}).get('status', 'stopping'))
    else:
        p = find_pod()
        print({k: p.get(k) for k in ('id', 'status', 'cost')} if p else 'no pod')
        if p and p.get('status') == 'RUNNING' and state().get('token'):
            print(poll(p['id'], state()['token'], 'render')['log'][-400:])
