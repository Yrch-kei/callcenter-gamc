import os
import shutil
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import whisper

app = FastAPI(title="Whisper STT Service - GAMC")

# Permitir conexiones desde Frontend y Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar el modelo base en español/multilingüe
print("Cargando modelo Whisper en memoria...")
model = whisper.load_model("base")
print("Modelo Whisper listo.")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "whisper-stt"}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        ext = os.path.splitext(file.filename)[1] or ".wav"
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_audio:
            shutil.copyfileobj(file.file, temp_audio)
            temp_path = temp_audio.name

        # Transcripción directa forzando español
        result = model.transcribe(temp_path, language="es")

        if os.path.exists(temp_path):
            os.remove(temp_path)

        return {
            "text": result.get("text", "").strip(),
            "language": result.get("language", "es")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Corre en el puerto 5000 para no chocar con el backend (4000) ni frontend (5173)
    uvicorn.run(app, host="0.0.0.0", port=5000)