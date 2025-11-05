import { AutoTokenizer, AutoProcessor, SpeechT5ForTextToSpeech, SpeechT5HifiGan, Tensor } from '@huggingface/transformers';
import fs from 'fs';

async function main() {
    try {
        // Load the tokenizer and processor
        const tokenizer = await AutoTokenizer.from_pretrained('Xenova/speecht5_tts');
        const processor = await AutoProcessor.from_pretrained('Xenova/speecht5_tts');

        // Load the models
        const model = await SpeechT5ForTextToSpeech.from_pretrained('Xenova/speecht5_tts', { dtype: "fp32" });
        const vocoder = await SpeechT5HifiGan.from_pretrained('Xenova/speecht5_hifigan', { dtype: "fp32" });

        // Load speaker embeddings from URL
        const speaker_embeddings_data = new Float32Array(
            await (await fetch('https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin')).arrayBuffer()
        );
        const speaker_embeddings = new Tensor(
            'float32',
            speaker_embeddings_data,
            [1, speaker_embeddings_data.length]
        );

        // Run tokenization
        const { input_ids } = tokenizer('Naa Peru Asha');

        // Generate waveform
        const { waveform } = await model.generate_speech(input_ids, speaker_embeddings, { vocoder });
        
        // Convert waveform to WAV file and save
        const audioData = waveform.data;
        const wavBuffer = createWavFile(audioData, 16000); // 16kHz sample rate
        fs.writeFileSync('output.wav', wavBuffer);
        
        console.log('Audio saved as output.wav');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Helper function to create WAV file from audio data
function createWavFile(audioData, sampleRate) {
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + audioData.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, audioData.length * 2, true);
    
    // Audio data
    let offset = 44;
    for (let i = 0; i < audioData.length; i++) {
        const sample = Math.max(-1, Math.min(1, audioData[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
    }
    
    return Buffer.from(buffer);
}

main();