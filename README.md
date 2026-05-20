# Willigon

**Remote photoplethysmography meets cerebrovascular anatomy  real-time, contact-free cardiac monitoring with 3D visualization of the Circle of Willis.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111%2B-009688)](https://fastapi.tiangolo.com/)
[![Method: POS rPPG](https://img.shields.io/badge/Method-POS%20rPPG-purple)](https://doi.org/10.1109/TBIOM.2021.3122295)
[![Educational](https://img.shields.io/badge/Purpose-Educational-orange)](.)

[Overview](#overview) · [Scientific Background](#scientific-background) · [Architecture](#architecture) · [Installation](#installation) · [Usage](#usage) · [Clinical Relevance](#clinical-relevance) · [References](#references)

---

## Overview

Willigon is an open-source, browser-based application that measures heart rate from a standard webcam  no sensors, no contact  and visualizes the resulting cardiac signal through a real-time animation of the **Circle of Willis** (Polygone de Willis), the arterial ring that supplies the entire human brain.

The project serves a dual purpose:

- **Technical demonstration** of remote photoplethysmography (rPPG) using the POS (Plane-Orthogonal-to-Skin) algorithm with FFT-based frequency estimation
- **Educational tool** for medical students, biomedical engineers, and public health practitioners, connecting a measurable physiological signal to its cerebrovascular consequences in an immediate, visual way

```
Webcam → Face detection → ROI extraction → POS signal → Bandpass filter → FFT → BPM
                                                                                  ↓
                                              Circle of Willis pulses in sync (2D + 3D)
```

---

## Scientific Background

### 1. Remote Photoplethysmography (rPPG)

Photoplethysmography (PPG) is the optical detection of volumetric blood-flow changes in tissue. Classical PPG uses a physical sensor in contact with the skin (fingertip, earlobe). **Remote PPG** (rPPG) extends this principle to conventional RGB cameras, exploiting the fact that skin reflectance varies subtly with each cardiac cycle as blood volume oscillates in the superficial vasculature.

The physical mechanism relies on the differential absorption of haemoglobin in the visible spectrum:

- Oxyhaemoglobin (HbO₂) absorbs strongly at 540–580 nm (green channel)
- Each systolic pulse transiently increases blood volume in the dermis
- This modulates reflected light intensity with a periodicity equal to the heart rate

Verkruysse et al. (2008) first demonstrated that the green channel of an unmodified consumer camera contains a measurable cardiac signal at distances up to several meters. Subsequent work established that multi-channel processing (RGB) significantly improves signal-to-noise ratio by exploiting spectral orthogonality between the pulse signal and motion/illumination artefacts.

#### The POS Algorithm

Willigon implements the **Plane-Orthogonal-to-Skin (POS)** method introduced by de Haan & Jeanne (2013), which remains one of the most robust colour-space decompositions for rPPG:

1. **Normalisation**  raw RGB traces are divided by their temporal mean to remove inter-frame illumination drift:

   $C_n(t) = \frac{[R(t), G(t), B(t)]}{\bar{R}, \bar{G}, \bar{B}}$

2. **Projection**  two orthogonal signals are computed:

   $S_1 = C_n^G - C_n^B \qquad S_2 = C_n^R + C_n^G - 2C_n^B$

3. **Adaptive combination**  the pulse signal is extracted as:

   $H(t) = S_1 - \frac{\sigma_{S_1}}{\sigma_{S_2}} \cdot S_2$

4. **Bandpass filtering**  a 4th-order Butterworth filter isolates the physiologically plausible cardiac range (0.75–3.0 Hz, i.e. 45–180 BPM)

5. **Frequency estimation**  a Hanning-windowed FFT with 4× zero-padding identifies the dominant spectral peak, reported as the instantaneous BPM

This pipeline achieves reported mean absolute errors of 1.5–3.1 BPM under favourable conditions (stable illumination, minimal motion) in the literature, compared to contact ECG or pulse oximetry reference standards.

#### Face Region of Interest (ROI)

The forehead is selected as the ROI for two reasons validated in the rPPG literature:

- It presents a large, flat, relatively hair-free skin surface
- The supraorbital and superficial temporal vessels (branches of the external carotid) produce a strong and consistent pulse amplitude
- It is less susceptible to lip and jaw movement artefacts than the cheek region

ROI dimensions: central 50% width × 15–35% height of the detected face bounding box (Haar cascade, OpenCV).

---

### 2. The Circle of Willis and Its Relationship to the Cardiac Signal

The **Circle of Willis** (Polygone de Willis, *circulus arteriosus cerebri*) is a polygonal anastomotic ring at the base of the brain, first systematically described by Thomas Willis in *Cerebri Anatome* (1664). It connects the anterior and posterior cerebral circulations and constitutes the primary collateral pathway of the intracranial vasculature.

#### Anatomical composition

| Structure | Origin | Territory irrigated |
|---|---|---|
| Basilar artery | Bilateral vertebral arteries | Brainstem, cerebellum, posterior thalamus |
| Posterior cerebral arteries (PCAs) | Basilar bifurcation | Occipital lobe (visual cortex), inferior temporal |
| Posterior communicating arteries (PComA) | ICA–PCA junction | Collateral bridge, hypothalamus |
| Internal carotid arteries (ICAs) | Common carotid | Main anterior supply |
| Anterior cerebral arteries (ACAs) | ICA bifurcation | Frontal lobe, medial cortex, motor strip (leg area) |
| Anterior communicating artery (AComA) | ACA–ACA junction | Critical collateral bridge |
| Middle cerebral arteries (MCAs) | ICA bifurcation | Lateral cortex, motor/sensory strip (face, arm), Broca/Wernicke |

The brain receives approximately **750 mL/min** (~15% of cardiac output) despite representing only 2% of body mass. This extreme metabolic dependence  cerebral oxygen consumption of 3.5 mL O₂/100g/min at rest  makes pulsatile blood delivery through the Circle of Willis a moment-to-moment life-critical process.

#### Why the cardiac pulse matters at the Circle of Willis

Each cardiac systole generates a pressure wave that propagates from the aorta through the carotid and vertebral arteries to the Circle of Willis within ~60–80 ms. The pulsatile nature of this flow has direct mechanical consequences:

- **Intracranial pressure (ICP) modulation**  each pulse transiently raises ICP by 2–5 mmHg in healthy individuals; blunted pulsatility is a marker of reduced cerebral compliance
- **Cerebral autoregulation**  the cerebral perfusion pressure (CPP = MAP − ICP) is actively maintained between 50–150 mmHg by myogenic and metabolic mechanisms in the arterioles distal to the polygon
- **Windkessel effect**  the elastic walls of the polygon and proximal cerebral arteries buffer systolic peaks, smoothing pulsatile flow into more laminar flow for the capillary bed

**The rPPG signal measured at the face surface and the pulsation animated at the Circle of Willis share the same cardiac event as causal origin.** They are separated only by a vascular path length of ~30–40 cm and a propagation delay of under 100 ms  physiologically negligible at the timescale of a heartbeat.

---

## Clinical Relevance

The pairing of rPPG with Circle of Willis visualisation is not merely aesthetic. It reflects a body of clinical evidence connecting heart rate patterns  exactly what Willigon measures  to cerebrovascular disease:

### Bradycardia and cerebrovascular risk

The **Cushing reflex** (Cushing response) produces bradycardia as a compensatory response to elevated ICP compressing the brainstem. An acute bradycardia detected by rPPG (< 50 BPM, flagged as `brady` in Willigon) may therefore be an early, non-contact-detectable sign of impending brainstem herniation in monitored patients.

### Tachycardia and cerebral hypoperfusion

At sustained heart rates > 120 BPM (`tachy` / `critical_high`), diastolic filling time shortens, reducing cardiac output per beat. Combined with potential hypotension, this diminishes CPP and cerebral blood flow velocity in the MCA  measurable by transcranial Doppler and correlated with rPPG signal quality degradation (Rong & Li, 2019).

### Cardiac arrhythmia and embolic stroke

Atrial fibrillation produces an irregular inter-beat interval that manifests as spectral broadening in the FFT output  the same FFT Willigon uses for BPM estimation. The absence of a clear spectral peak in the physiological band is a qualitative indicator of irregular rhythm, accounting for a significant fraction of embolic strokes whose source is thromboembolism from the left atrial appendage transiting through the carotid arteries to the Circle of Willis.

### Non-invasive monitoring: the research frontier

Active research programmes are investigating rPPG for:

- **ICU continuous monitoring** without electrode adhesion (relevant for burn or neonatal patients)
- **Post-stroke telemedicine** follow-up of cardiac risk factors
- **Intraoperative monitoring** during neurovascular surgery where maintaining CPP is critical

Willigon is positioned as a pedagogical entry point into this research space.

---

## Architecture

```
Willigon/
├── backend/                     Python / FastAPI
│   ├── server.py                WebSocket endpoint /ws/rppg
│   └── app/
│       ├── services/
│       │   ├── face_detector.py Haar cascade face + ROI detection
│       │   ├── rppg.py          RPPGProcessor  POS pipeline + BPM classification
│       │   ├── fft_processor.py FFT-based dominant frequency extraction
│       │   └── gaussian_pyramid.py  Spatial downsampling for signal extraction
│       ├── schemas/bpm.py       Pydantic response model
│       └── routes/ws_bpm.py     WebSocket route
│
└── frontend/                    React 19 / TypeScript / Vite
    └── src/
        ├── App.tsx              Layout, theme, resize, modal orchestration
        ├── components/
        │   ├── WebcamPanel/     Live video + face bounding box overlay
        │   ├── WaveformPanel/   Canvas rPPG waveform + BPM display
        │   ├── Polygon2D/       SVG anatomical diagram  beat-synchronized
        │   ├── Model3D/         Google model-viewer GLB  3D Willis polygon
        │   └── InfoModal/       Educational modal (rPPG + anatomy + guide)
        ├── hooks/
        │   ├── useWebSocket.ts  WS connection lifecycle management
        │   ├── useRPPG.ts       Frame capture loop (getUserMedia → canvas → b64)
        │   ├── useFaceROI.ts    Canvas overlay drawing for face bounding box
        │   └── useBeatClock.ts  setTimeout-based beat scheduler from BPM
        └── types/rppg.ts        RPPGStatus, BBoxData, BPMData, BeatEvent
```

### Signal pipeline (frame-by-frame)

```
Browser (getUserMedia)
  └─ canvas.drawImage → toDataURL (JPEG, q=0.6)
       └─ WebSocket send {type: "frame", data: "data:image/jpeg;base64,..."}
            └─ FastAPI /ws/rppg
                 ├─ base64 decode → cv2.imdecode → BGR frame
                 ├─ Haar cascade → face bounding box
                 ├─ ROI crop (forehead 25–75% × 15–35%)
                 ├─ Mean BGR → rgb_buffer (deque, 10 s)
                 ├─ POS projection → pulse signal
                 ├─ Butterworth bandpass (0.75–3.0 Hz)
                 ├─ Hanning-windowed FFT (4× zero-padding)
                 └─ WebSocket send {bpm, signal, status, bbox, ready}
```

### BPM classification thresholds

| Status | BPM range | Clinical interpretation |
|---|---|---|
| `estimating` |  | < 3 s of data collected; pipeline warming up |
| `no_face` |  | No face detected in frame |
| `normal` | 60–100 | Normocardic sinus rhythm (adult at rest) |
| `brady` | 30–59 | Bradycardia  may be physiological (athletes) or pathological |
| `tachy` | 101–120 | Tachycardia  requires context (exercise, fever, anxiety) |
| `critical_low` | ≤ 29 | Severe bradycardia / signal artefact |
| `critical_high` | > 120 | Severe tachycardia / signal artefact |

---

## Installation

### Prerequisites

| Component | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| Browser | Chrome / Firefox (getUserMedia required) |
| Webcam | Any standard RGB camera, ≥ 720p recommended |

### Backend

```bash
git clone https://github.com/your-org/Willigon.git
cd Willigon/backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

Core backend dependencies: `fastapi`, `uvicorn`, `opencv-python-headless`, `numpy`, `scipy`, `mediapipe`, `pydantic`

### Frontend

```bash
cd Willigon/frontend

# Install dependencies
npm install

# Start development server (HTTPS required for webcam access)
npm run dev
```

Then open `https://localhost:5173` in your browser (accept the self-signed certificate).

### Environment variables

```bash
# backend/.env
PORT=8000

# frontend/.env
VITE_WS_URL=ws://localhost:8000/ws/rppg
```

---

## Usage

### Interface panels

The interface is divided into four independently resizable panels (drag the separators):

| Position | Panel | Content |
|---|---|---|
| Top left | **Webcam** | Live video feed with face detection overlay and status badge |
| Top right | **3D Model** | Interactive GLB model of the Circle of Willis  rotatable, zoomable |
| Bottom left | **Waveform** | Real-time rPPG signal trace + BPM counter |
| Bottom right | **2D Anatomy** | SVG anatomical diagram of the Circle of Willis, pulsing at measured BPM |

### Theme and controls

- Toggle dark / light theme (persists across panels and canvas rendering)
- Open the educational modal (rPPG explanation, anatomy guide, usage tips)
- **Drag separators**  Freely resize any panel pair horizontally or vertically

### Best measurement conditions

For optimal rPPG signal quality, as established in the validation literature:

1. Face the camera squarely at 40–70 cm distance
2. Ensure diffuse, stable frontal illumination (avoid backlighting)
3. Remain still for the first 5–10 seconds (pipeline calibration phase)
4. Avoid strong facial expressions or rapid head movements during estimation
5. Signal quality degrades significantly with beards, face masks, or strong make-up over the forehead

---

## Validation and Limitations

### Accuracy expectations

Under controlled conditions (stable illumination, minimal motion, Fitzpatrick skin types I–IV):

| Metric | Reported in literature | Method |
|---|---|---|
| Mean Absolute Error | 1.5–3.5 BPM | POS vs. ECG reference |
| Pearson correlation | r = 0.93–0.99 | POS vs. pulse oximeter |
| Latency to first estimate | 3–10 s | Buffer fill time |

### Known limitations

- **Illumination sensitivity**  fluorescent lighting at 100/120 Hz can introduce harmonics into the green channel; LED lighting at >500 Hz is preferred
- **Dark skin tones**  rPPG signal amplitude is lower for higher Fitzpatrick scores (V–VI) due to increased melanin absorption; specialised pre-processing (Nowara et al., 2020) is not yet implemented
- **Motion artefacts**  head movements at frequencies overlapping the cardiac band (0.75–3.0 Hz) are the primary source of error; spatial filtering (Gaussian pyramid) partially mitigates this
- **This is not a medical device**  Willigon is an educational demonstration tool. It is not validated for clinical use and must not be used for diagnostic or therapeutic decisions

---

## Scientific References

1. **Verkruysse W, Svaasand LO, Nelson JS.** Remote plethysmographic imaging using ambient light. *Optics Express.* 2008;16(26):21434–21445. https://doi.org/10.1364/OE.16.021434

2. **Poh M-Z, McDuff DJ, Picard RW.** Non-contact, automated cardiac pulse measurements using video imaging and blind source separation. *Optics Express.* 2010;18(10):10762–10774. https://doi.org/10.1364/OE.18.010762

3. **de Haan G, Jeanne V.** Robust pulse rate from chrominance-based rPPG. *IEEE Transactions on Biomedical Engineering.* 2013;60(10):2878–2886. https://doi.org/10.1109/TBME.2013.2266196

4. **Wang W, den Brinker AC, Stuijk S, de Haan G.** Algorithmic principles of remote PPG. *IEEE Transactions on Biomedical Engineering.* 2017;64(7):1479–1491. https://doi.org/10.1109/TBME.2016.2609282

5. **Rong Q, Li B.** Relation between facial rPPG signal and cerebral blood flow velocity measured by transcranial Doppler. *IEEE EMBC.* 2019:2148–2151. https://doi.org/10.1109/EMBC.2019.8856870

6. **Nowara EM, McDuff D, Veeraraghavan A.** Adverse Bias in Face-Based Physiological Measurement. *arXiv.* 2020. https://arxiv.org/abs/2009.01189

7. **Willis T.** *Cerebri Anatome: Cui Accessit Nervorum Descriptio et Usus.* London: Martyn & Allestry; 1664.

8. **Alpers BJ et al.** Anatomical studies of the Circle of Willis in normal brain. *Archives of Neurology and Psychiatry.* 1959;81(4):409–418.

9. **Cipolla MJ.** The Cerebral Circulation. *Colloquium Series on Integrated Systems Physiology.* 2009. https://doi.org/10.4199/C00005ED1V01Y200912ISP002

10. **Rangel-Castilla L, Gopinath S, Robertson CS.** Management of intracranial hypertension. *Neurologic Clinics.* 2008;26(2):521–541. https://doi.org/10.1016/j.ncl.2008.02.003

11. **Cushman G.W.** Some experimental and clinical observations concerning states of increased intracranial tension. *American Journal of Medical Sciences.* 1901;121:375–400.

12. **Kermack WO, McKendrick AG.** A contribution to the mathematical theory of epidemics. *Proc. Royal Society A.* 1927;115:700–721.

---


## Contributing

Contributions are welcome. Please open an issue before submitting a pull request.

```bash
git clone https://github.com/your-org/Willigon.git
cd Willigon

# Backend
cd backend && pip install -r requirements.txt

# Frontend
cd ../frontend && npm install
```

Areas of interest for contributors:
- Signal processing improvements (ICA, CHROM method)
- Skin tone compensation (Fitzpatrick V–VI)
- Motion artefact rejection (optical flow head pose estimation)
- Mobile responsiveness
- Additional anatomical models

---

## License

MIT License  see [LICENSE](LICENSE) for details.

---

## About

**Author:** Fildouindé Ariel Shadrac Ouedraogo  
**Organization:** Xcept-Health, Ouagadougou, Burkina Faso  
**Affiliation:** MD Candidate, Université Joseph Ki-Zerbo, Department of Medicine

Willigon is an open-source educational health-technology project developed independently in Ouagadougou, Burkina Faso. It is part of a broader effort to make biomedical signal processing and anatomical education accessible through modern web technologies, including in low-resource contexts.

> *"The Circle of Willis is not a diagram in a textbook. It is the reason you are reading this."*

---

*Built for education and research · Not a medical device · Xcept-Health · Burkina Faso*