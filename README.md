# Prompt Detection Website

## Local setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in:

- `RESEND_API_KEY`
- `CONTACT_EMAIL`
- `DETECTOR_API_URL`

The detector test lab uses `app/api/detect/route.ts` as a thin proxy to a separate backend service.

## Lightweight detector backend

Run the backend from the detector repo:

```bash
cd ../Prompt-engineering-detection
pip install -r lightweight_api_requirements.txt
uvicorn lightweight_api.app:app --reload
```

Then keep `DETECTOR_API_URL=http://127.0.0.1:8000` in the website env file.
