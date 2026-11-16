# ya-serisi

"Ya ...?" tarzı dikey (9:16) animasyon serisi üretim hattı. Her kare kodla çizilir (SVG + Remotion), ses ElevenLabs'ten gelir.

Temel: [kelano86/what-if-animation](https://github.com/kelano86/what-if-animation) (lisansı `LICENSE.what-if-animation`). Bu depoda motor dikey 1080×1920 kadraja uyarlandı ve fontlar yerel pakete alındı (Türkçe karakterler dahil).

| Klasör | Ne var |
|---|---|
| `seri/` | Seri dosyası (`SERI.md`) ve bölüm senaryoları |
| `studio/` | Remotion projesi: motor, mekânlar, karakterler, bölümler |
| `skill/` | Üretim adımları (`SKILL.md`), referanslar, betikler |
| `tools/` | Yardımcı betikler |

## Kurulum

```bash
cd studio && npm install
python3 ../skill/scripts/plan.py dusunce
python3 ../skill/scripts/master.py dusunce   # out/dusunce/dusunce-final.mp4
```

Node 18+, ffmpeg, Python 3.9+ (`numpy`, `Pillow`) gerekir. Anahtarlar depoya yazılmaz.
