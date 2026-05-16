# LM Studio Model Guide

Local Prompt Studio depends on LM Studio for model management.

## Can I Add Models Inside Local Prompt Studio?

No. Local Prompt Studio does not download, import, quantize, or load models directly.

Use LM Studio for:

- Downloading models
- Importing GGUF files
- Connecting projector/mmproj files
- Loading models into memory
- Running the local OpenAI-compatible API server

Local Prompt Studio only detects models that LM Studio has already loaded.

## Recommended Model Type

For image-to-prompt generation, use a vision or multimodal model.

Search terms:

```text
vision
vl
llava
qwen-vl
multimodal
image
```

Text-only models may appear in the list, but they usually cannot analyze uploaded images correctly.

## Why Is My Model Not Showing?

Check these items:

1. LM Studio is installed.
2. LM Studio is open.
3. The model is loaded in LM Studio.
4. LM Studio local server is running.
5. Local Prompt Studio model list was refreshed.

Default LM Studio API URL:

```text
http://127.0.0.1:1234/v1/models
```

If that URL does not show a model list, Local Prompt Studio cannot connect yet.

## GGUF and mmproj Files

Many local vision models use GGUF files and may also require an mmproj/projector file.

Those files must be configured in LM Studio. Local Prompt Studio cannot attach mmproj files by itself.

## Large Models

Large models can be slow or fail if the user's computer does not have enough RAM/VRAM.

If generation fails or returns an empty answer:

- Try a smaller quantized model.
- Lower context length in LM Studio.
- Confirm the model supports image input.
- Restart LM Studio.
- Reload the model.

