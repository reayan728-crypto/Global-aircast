# Local Sign-Language Video Clips (`public/signs/`)

Place your local `.mp4` sign-language clips directly inside this `public/signs/` folder. AirCast loads them strictly from local paths (no YouTube or external video URLs) using `AirCastA11y.configure({ signWords: { ... } })`.

## Expected Filenames

| Word Key | File Path |
| --- | --- |
| `air` | `public/signs/air.mp4` |
| `good` | `public/signs/good.mp4` |
| `okay` | `public/signs/okay.mp4` |
| `bad` | `public/signs/bad.mp4` |
| `very-bad` | `public/signs/very-bad.mp4` |
| `careful` | `public/signs/careful.mp4` |
| `danger` | `public/signs/danger.mp4` |
| `mask` | `public/signs/mask.mp4` |
| `home` | `public/signs/home.mp4` |
| `doctor` | `public/signs/doctor.mp4` |
| `hospital` | `public/signs/hospital.mp4` |
| `help` | `public/signs/help.mp4` |

## How It Works

1. Add any or all of the `.mp4` files above into `public/signs/`.
2. Vite serves files in `public/signs/` at `signs/<word>.mp4`, which matches the `signWords` configuration in `src/App.tsx`:
   ```ts
   AirCastA11y.configure({
     signWords: {
       air: 'signs/air.mp4',
       good: 'signs/good.mp4',
       okay: 'signs/okay.mp4',
       bad: 'signs/bad.mp4',
       'very-bad': 'signs/very-bad.mp4',
       careful: 'signs/careful.mp4',
       danger: 'signs/danger.mp4',
       mask: 'signs/mask.mp4',
       home: 'signs/home.mp4',
       doctor: 'signs/doctor.mp4',
       hospital: 'signs/hospital.mp4',
       help: 'signs/help.mp4'
     }
   });
   ```
3. **Missing-file fallback**: If any `.mp4` file is not uploaded yet, the sign-language panel continues working and highlights the word text pill instead.
