# Virtfit Nowhere

"No more blind shopping." A fashion storefront where nine styles sit on a rotating ring, every look opens into shoppable pieces, and you can try clothes on your own photo before buying.

Prototype. Orders are stored in your browser only and no payment is taken.

## What's in it

| Page | What it does |
| --- | --- |
| `/` | The ring of nine styles. Tap a style to bring it to the front, tap again to open it. Opening a look shows the photo, three shoppable pieces on a till-receipt, and rows of more tops, bottoms and shoes to scroll through. |
| `/shop` | The whole catalogue (71 single pieces plus the 27 look pieces), filterable by category. |
| `/product/[id]` | One product, size picker, add to bag. |
| `/cart` | The bag. Whole-fit discount (10% off a complete 3-piece look), Clear bag, checkout. |
| `/checkout`, `/order/[id]` | Delivery details and an order page. Standard shipping $8 (free from $150), express $18. |
| `/fit-check` | The fitting room. Add your photo from Profile, then wear garments in two modes (below). |

### Fitting room modes

- **Photo.** Your garment is placed on your shoulders using on-device pose detection. **Make it real** sends your photo and the garment to a free try-on model and shows the dressed picture.
- **3D.** A 3D avatar built from your photo's pose and your height, with your face on the head, five motions (Idle, Walk, 360, Reach up, Twist, Breakdance) and a fit heatmap (red tight, blue loose) for the S to XL size you pick.

## Run it

Needs Node 20+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build && npm start   # production build (not yet tested)
```

## How it works

- **Stack:** Next.js 15 (App Router), React 19, TypeScript, Zustand (bag, orders and profile persist in `localStorage`), three.js, plain CSS.
- **Pose and face:** MediaPipe Pose Landmarker, loaded at runtime from jsDelivr and Google Storage, so the first fitting-room visit needs internet. It runs in the browser; the photo does not leave the device for this.
- **Make it real:** `app/api/vton/route.ts` uploads your photo and the garment picture to the public **Kolors Virtual Try-On** demo on Hugging Face and returns the result. This is the only time your photo leaves your device. Set `TRYON_SPACE` to point at another Gradio space.
- **Data:** `lib/looks.ts` defines the nine looks and their pieces, `lib/catalog.ts` the single products. Look pieces are crops of each ring photo in `public/garments/`; ring photos are in `public/looks/`.
- **Optional paid path:** `app/api/tryon`, `animate` and `prediction` call Replicate (IDM-VTON, MimicMotion). They are written but have never been run. Copy `.env.example` to `.env.local` and add `REPLICATE_API_TOKEN` to try them.
- **Dev only:** `/picker` and `/api/stl` browse the Pinterest Shop-the-Look dataset (cloned to `STL-Dataset/`, git-ignored) that the catalogue images came from.

## Known limits

- **Try-on demo.** A shared free service with no uptime promise. It can be busy or decline a photo; it works best with a clear, front-facing, full-length photo. Replace it with a paid or self-hosted model before real traffic or commercial use.
- **3D avatar.** Body size is an estimate from joint distances. The face is a small crop from your photo, so a full-body photo gives a soft face. The garment is a plain coloured shape, not the product's real pattern.
- **Not built:** side-by-side size comparison, cloth sway, clip export, back-of-garment images, a separate selfie step for the face.
- **Images.** The catalogue and ring photos are prototype and non-commercial: Pinterest dataset pictures and watermarked photos. Swap in licensed photography before launch.
- **Checkout.** No payment and no server-side orders.
- **Testing.** Not tested on phones, in production build mode, or with automated tests.
- `sharp` (used by the try-on route) is not listed in `package.json`; it currently comes along with Next.js. Add it explicitly before deploying.
