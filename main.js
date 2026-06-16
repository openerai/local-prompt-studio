const fs = require('fs/promises');
const path = require('path');
const { execFile, spawn } = require('child_process');
const { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } = require('electron');
const { autoUpdater } = require('electron-updater');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MODEL_EXTENSIONS = new Set(['.gguf', '.safetensors', '.bin', '.pt', '.pth', '.onnx']);
const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434';
const DEFAULT_OPENAI_URL = 'http://127.0.0.1:1234/v1';
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 920,
    minHeight: 640,
    title: 'Local Prompt Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  return mainWindow;
}

function setupAutoUpdater(win) {
  autoUpdater.autoDownload = false;
  autoUpdater.allowPrerelease = false;

  autoUpdater.on('update-available', async (info) => {
    const result = await dialog.showMessageBox(win, {
      type: 'info',
      buttons: ['다운로드', '나중에'],
      defaultId: 0,
      cancelId: 1,
      title: '업데이트가 있습니다',
      message: `Local Prompt Studio ${info.version} 버전이 있습니다.`,
      detail: '다운로드가 끝나면 앱을 다시 시작해 설치할 수 있습니다.'
    });
    if (result.response === 0) autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-not-available', () => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('updates:status', {
        status: 'current',
        message: '현재 최신 버전입니다.'
      });
    }
  });

  autoUpdater.on('update-downloaded', async (info) => {
    const result = await dialog.showMessageBox(win, {
      type: 'info',
      buttons: ['지금 재시작', '나중에'],
      defaultId: 0,
      cancelId: 1,
      title: '업데이트 다운로드 완료',
      message: `Local Prompt Studio ${info.version} 버전이 준비되었습니다.`,
      detail: '지금 재시작하면 새 버전이 설치됩니다.'
    });
    if (result.response === 0) autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (error) => {
    const message = String(error && error.message || error || '');
    if (message.includes('No published versions') || message.includes('No releases found')) {
      if (win && !win.isDestroyed()) {
        win.webContents.send('updates:status', {
          status: 'current',
          message: '아직 GitHub Release가 없습니다. 첫 배포 파일을 올리면 업데이트 확인이 작동합니다.'
        });
      }
      return;
    }
    if (win && !win.isDestroyed()) {
      win.webContents.send('updates:status', {
        status: 'error',
        message: `업데이트 확인 실패: ${message}`
      });
    }
  });
}

async function checkForUpdates({ manual = false } = {}) {
  if (!app.isPackaged) {
    const message = '자동 업데이트는 설치된 앱에서만 동작합니다. 개발 실행에서는 GitHub Release 확인을 건너뜁니다.';
    if (manual && mainWindow && !mainWindow.isDestroyed()) {
      await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '개발 모드',
        message
      });
    }
    return { status: 'dev', message };
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updates:status', {
      status: 'checking',
      message: '업데이트를 확인하는 중입니다...'
    });
  }

  await autoUpdater.checkForUpdates();
  return { status: 'checking', message: '업데이트 확인을 시작했습니다.' };
}

function setupRequiredAutoUpdater(win) {
  autoUpdater.autoDownload = true;
  autoUpdater.allowPrerelease = false;

  autoUpdater.on('update-available', (info) => {
    if (!win || win.isDestroyed()) return;
    win.webContents.send('updates:status', {
      status: 'checking',
      message: `새 버전 ${info.version}을 다운로드하는 중입니다.`
    });
  });

  autoUpdater.on('update-not-available', () => {
    if (!win || win.isDestroyed()) return;
    win.webContents.send('updates:status', {
      status: 'current',
      message: '현재 최신 버전입니다.'
    });
  });

  autoUpdater.on('update-downloaded', async (info) => {
    if (!win || win.isDestroyed()) {
      autoUpdater.quitAndInstall(false, true);
      return;
    }

    await dialog.showMessageBox(win, {
      type: 'info',
      buttons: ['재시작 및 설치'],
      defaultId: 0,
      cancelId: 0,
      title: '업데이트 설치 필요',
      message: `Local Prompt Studio ${info.version} 버전이 준비되었습니다.`,
      detail: '최신 기능과 오류 수정을 적용하려면 앱을 재시작해야 합니다. 확인을 누르면 새 버전이 설치됩니다.'
    });
    autoUpdater.quitAndInstall(false, true);
  });

  autoUpdater.on('error', (error) => {
    const message = String(error && error.message || error || '');
    if (!win || win.isDestroyed()) return;
    const hasNoRelease = message.includes('No published versions') || message.includes('No releases found');
    win.webContents.send('updates:status', {
      status: hasNoRelease ? 'current' : 'error',
      message: hasNoRelease
        ? '아직 GitHub Release가 없습니다. 첫 배포 파일을 올리면 업데이트 확인이 작동합니다.'
        : `업데이트 확인 실패: ${message}`
    });
  });
}

async function checkRequiredUpdates({ manual = false } = {}) {
  if (!app.isPackaged) {
    const message = '자동 업데이트는 설치된 앱에서만 작동합니다. 개발 실행에서는 GitHub Release 확인을 건너뜁니다.';
    if (manual && mainWindow && !mainWindow.isDestroyed()) {
      await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '개발 모드',
        message
      });
    }
    return { status: 'dev', message };
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updates:status', {
      status: 'checking',
      message: '업데이트를 확인하는 중입니다...'
    });
  }

  await autoUpdater.checkForUpdates();
  return { status: 'checking', message: '업데이트 확인을 시작했습니다.' };
}

app.whenReady().then(() => {
  const win = createWindow();
  setupRequiredAutoUpdater(win);
  setTimeout(() => {
    checkRequiredUpdates({ manual: false }).catch(() => {});
  }, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const nextWin = createWindow();
      setupRequiredAutoUpdater(nextWin);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('updates:check', async () => checkRequiredUpdates({ manual: true }));

ipcMain.handle('updates:install', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('app:getVersion', () => app.getVersion());

function isImagePath(filePath) {
  return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

async function readImageForModel(filePath) {
  const image = nativeImage.createFromPath(filePath);
  if (!image.isEmpty()) {
    const size = image.getSize();
    const maxSide = Math.max(size.width || 0, size.height || 0);
    const prepared = maxSide > 1400
      ? image.resize({
        width: size.width >= size.height ? 1400 : undefined,
        height: size.height > size.width ? 1400 : undefined,
        quality: 'good'
      })
      : image;
    const png = prepared.toPNG();
    const imageBase64 = png.toString('base64');
    return {
      imageBase64,
      imageDataUrl: `data:image/png;base64,${imageBase64}`
    };
  }

  const bytes = await fs.readFile(filePath);
  const imageBase64 = bytes.toString('base64');
  const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
  const mime = ext === 'jpg' ? 'jpeg' : ext;
  return {
    imageBase64,
    imageDataUrl: `data:image/${mime};base64,${imageBase64}`
  };
}

function defaultModelFolder() {
  return path.join(app.getPath('userData'), 'models');
}

async function resolveModelFolder(folderPath) {
  const fallback = defaultModelFolder();
  const candidate = String(folderPath || fallback);

  if (!candidate || candidate.includes('.asar')) {
    return fallback;
  }

  try {
    const stat = await fs.stat(candidate);
    if (!stat.isDirectory()) return fallback;
  } catch (_error) {
    // Missing folders are fine; callers create them after the path is resolved.
  }

  return candidate;
}

function defaultProjectsFolder() {
  return path.join(app.getPath('userData'), 'projects');
}

function projectFilePath(projectId) {
  return path.join(defaultProjectsFolder(), `${projectId}.json`);
}

function projectAssetFolder(projectId) {
  return path.join(defaultProjectsFolder(), projectId);
}

function createProjectId() {
  return `project-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function createItemId() {
  return `item-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function createEmptyProject(name = 'Untitled Project') {
  const now = new Date().toISOString();
  return {
    id: createProjectId(),
    name,
    createdAt: now,
    updatedAt: now,
    items: [],
    activeItemId: null
  };
}

async function ensureProjectsFolder() {
  await fs.mkdir(defaultProjectsFolder(), { recursive: true });
}

async function saveProject(project) {
  await ensureProjectsFolder();
  const nextProject = {
    ...project,
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(projectFilePath(nextProject.id), JSON.stringify(nextProject, null, 2), 'utf8');
  return nextProject;
}

async function readProject(projectId) {
  const raw = await fs.readFile(projectFilePath(projectId), 'utf8');
  return JSON.parse(raw);
}

async function listProjects() {
  await ensureProjectsFolder();
  const entries = await fs.readdir(defaultProjectsFolder(), { withFileTypes: true });
  const projects = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    try {
      const project = JSON.parse(await fs.readFile(path.join(defaultProjectsFolder(), entry.name), 'utf8'));
      projects.push({
        id: project.id,
        name: project.name,
        updatedAt: project.updatedAt,
        itemCount: Array.isArray(project.items) ? project.items.length : 0
      });
    } catch (_error) {
      // Ignore malformed project files.
    }
  }

  return projects.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function execFileAsync(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(file, args, options, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function hasOllamaCommand() {
  try {
    await execFileAsync('ollama', ['--version'], { windowsHide: true });
    return true;
  } catch (_error) {
    return false;
  }
}

async function isOllamaReachable() {
  try {
    const response = await fetch(`${DEFAULT_OLLAMA_URL}/api/tags`);
    return response.ok;
  } catch (_error) {
    return false;
  }
}

async function startOllamaServer() {
  if (await isOllamaReachable()) return true;
  if (!(await hasOllamaCommand())) return false;

  const child = spawn('ollama', ['serve'], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();

  for (let index = 0; index < 20; index += 1) {
    await wait(500);
    if (await isOllamaReachable()) return true;
  }

  return false;
}

async function pullOllamaModel(model) {
  await execFileAsync('ollama', ['pull', model], {
    timeout: 30 * 60 * 1000,
    windowsHide: true
  });
}

async function hasLmsCommand() {
  try {
    await execFileAsync('lms', ['--help'], { windowsHide: true });
    return true;
  } catch (_error) {
    return false;
  }
}

async function installLMStudio() {
  await execFileAsync('winget', [
    'install',
    '--id',
    'LMStudio.LMStudio',
    '-e',
    '--accept-source-agreements',
    '--accept-package-agreements'
  ], {
    timeout: 20 * 60 * 1000,
    windowsHide: true
  });
}

async function startLMStudioServer() {
  if (!(await hasLmsCommand())) return false;

  try {
    await execFileAsync('lms', ['server', 'start', '--port', '1234', '--bind', '127.0.0.1'], {
      timeout: 30 * 1000,
      windowsHide: true
    });
  } catch (_error) {
    // If the server is already running, LM Studio may return a non-zero exit code.
  }

  for (let index = 0; index < 20; index += 1) {
    try {
      const response = await fetch(`${DEFAULT_OPENAI_URL}/models`);
      if (response.ok) return true;
    } catch (_error) {
      // Wait and retry.
    }
    await wait(500);
  }

  return false;
}

async function prepareLMStudioEnvironment(folderPath) {
  let installed = await hasLmsCommand();
  let installAttempted = false;
  let installError = null;

  if (!installed) {
    installAttempted = true;
    try {
      await installLMStudio();
      installed = await hasLmsCommand();
    } catch (error) {
      installError = error.message;
    }
  }

  let serverStarted = false;
  if (installed) {
    serverStarted = await startLMStudioServer();
  }

  const report = await checkEnvironment(folderPath);
  return {
    ...report,
    installAttempted,
    installError,
    serverStarted,
    recommendation: installed
      ? serverStarted
        ? 'LM Studio 서버를 준비했습니다. LM Studio에 로드된 모델을 선택해 생성할 수 있습니다.'
        : 'LM Studio는 감지됐지만 서버를 자동으로 켜지 못했습니다. LM Studio 앱을 한 번 열고 다시 시도하세요.'
      : 'LM Studio 설치가 필요합니다. 자동 설치가 실패하면 lmstudio.ai에서 설치해 주세요.'
  };
}

function parseLmsPs(stdout) {
  return String(stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('IDENTIFIER'))
    .map((line) => {
      const parts = line.split(/\s{2,}/).filter(Boolean);
      const identifier = parts[0];
      const model = parts[1] || identifier;
      if (!identifier || identifier === 'No') return null;
      return {
        name: model,
        provider: 'openai',
        endpoint: DEFAULT_OPENAI_URL,
        model: identifier,
        filePath: null,
        source: 'lmstudio-loaded'
      };
    })
    .filter(Boolean);
}

async function fetchLMStudioModels() {
  try {
    if (await hasLmsCommand()) {
      const { stdout } = await execFileAsync('lms', ['ps'], {
        timeout: 10 * 1000,
        windowsHide: true
      });
      const loadedModels = parseLmsPs(stdout);
      if (loadedModels.length) return loadedModels;
    }
  } catch (_error) {
    // Fall back to the OpenAI-compatible API model list below.
  }

  const apiModels = await getOpenAICompatibleModels();
  return apiModels.map((model) => ({
    name: model,
    provider: 'openai',
    endpoint: DEFAULT_OPENAI_URL,
    model,
    filePath: null,
    source: 'lmstudio-api'
  }));
}

async function getOpenAICompatibleModels() {
  try {
    const response = await fetch(`${DEFAULT_OPENAI_URL}/models`);
    if (!response.ok) return [];
    const json = await response.json();
    const models = Array.isArray(json.data) ? json.data : [];
    return models.map((model) => model.id).filter(Boolean);
  } catch (_error) {
    return [];
  }
}

function summarizeVisionCandidates(models) {
  return models.filter((model) => {
    const value = typeof model === 'string'
      ? model.toLowerCase()
      : `${model.name || ''} ${model.model || ''} ${model.source || ''}`.toLowerCase();
    return value.includes('vision') ||
      value.includes('vl') ||
      value.includes('llava') ||
      value.includes('mllama') ||
      value.includes('moondream') ||
      value.includes('qwen');
  });
}

async function checkEnvironment(folderPath) {
  const targetFolder = await resolveModelFolder(folderPath);
  const [
    lmsInstalled,
    lmStudioApiModels,
    lmStudioLoadedModels,
    scanned
  ] = await Promise.all([
    hasLmsCommand(),
    getOpenAICompatibleModels(),
    fetchLMStudioModels(),
    scanModelFolder(targetFolder)
  ]);

  const localFiles = scanned.models.filter((model) => model.source === 'file');
  const visionCandidates = summarizeVisionCandidates(lmStudioLoadedModels);

  let recommendation = 'LM Studio가 필요합니다. 자동 준비를 누르면 설치와 서버 시작을 시도합니다.';
  let status = 'blocked';

  if (!lmsInstalled) {
    status = 'blocked';
    recommendation = 'LM Studio가 설치되어 있지 않습니다. 자동 준비를 눌러 설치를 시작하세요.';
  } else if (lmStudioLoadedModels.length > 0) {
    status = lmStudioApiModels.length > 0 ? 'ready' : 'action';
    recommendation = lmStudioApiModels.length > 0
      ? 'LM Studio에 로드된 모델과 API 서버가 감지되었습니다. 바로 생성할 수 있습니다.'
      : 'LM Studio 모델은 로드되어 있습니다. 앱이 생성 시 서버 시작을 시도합니다.';
  } else if (lmsInstalled) {
    status = 'action';
    recommendation = 'LM Studio는 설치되어 있습니다. LM Studio에서 모델을 다운로드/로드한 뒤 Refresh를 누르세요.';
  }

  return {
    status,
    recommendation,
    folderPath: scanned.folderPath,
    checks: [
      { label: 'LM Studio 설치', ok: lmsInstalled, detail: lmsInstalled ? '감지됨' : '미설치' },
      { label: 'LM Studio 서버', ok: lmStudioApiModels.length > 0, detail: lmStudioApiModels.length > 0 ? '실행 중' : '꺼짐 또는 미응답' },
      { label: '로드된 모델', ok: lmStudioLoadedModels.length > 0, detail: `${lmStudioLoadedModels.length}개 로드됨` },
      { label: '비전 후보', ok: visionCandidates.length > 0, detail: `${visionCandidates.length}개 후보` },
      { label: '보관 모델 파일', ok: localFiles.length > 0, detail: `${localFiles.length}개 파일 감지` }
    ],
    models: {
      lmStudioApi: lmStudioApiModels,
      lmStudioLoaded: lmStudioLoadedModels.map((model) => model.model),
      localFiles: localFiles.map((model) => model.name),
      visionCandidates: visionCandidates.map((model) => typeof model === 'string' ? model : model.model)
    }
  };
}

function normalizeModelEntry(entry, folderPath) {
  if (!entry || typeof entry !== 'object') return null;
  const name = String(entry.name || entry.model || entry.path || '').trim();
  if (!name) return null;
  const modelName = String(entry.model || name).trim();
  if (!modelName || modelName === 'your-loaded-model-name') return null;

  return {
    name,
    provider: entry.provider === 'openai' ? 'openai' : 'ollama',
    endpoint: entry.endpoint || entry.baseUrl || (entry.provider === 'openai' ? DEFAULT_OPENAI_URL : DEFAULT_OLLAMA_URL),
    model: modelName,
    filePath: entry.path ? path.resolve(folderPath, entry.path) : entry.filePath || null,
    source: 'model-list.json'
  };
}

async function readModelManifest(folderPath) {
  const manifestPath = path.join(folderPath, 'model-list.json');
  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed) ? parsed : parsed.models;
    if (!Array.isArray(entries)) return [];
    return entries.map((entry) => normalizeModelEntry(entry, folderPath)).filter(Boolean);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new Error(`model-list.json could not be read: ${error.message}`);
  }
}

async function scanModelFiles(folderPath) {
  const found = [];

  async function walk(currentPath, depth) {
    if (depth > 2 || found.length >= 100) return;
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const itemPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(itemPath, depth + 1);
        continue;
      }

      if (!MODEL_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
      found.push({
        name: path.basename(entry.name, path.extname(entry.name)),
        provider: 'openai',
        endpoint: DEFAULT_OPENAI_URL,
        model: path.basename(entry.name, path.extname(entry.name)),
        filePath: itemPath,
        source: 'file'
      });
    }
  }

  await walk(folderPath, 0);
  return found;
}

function isLikelyVisionModel(model) {
  const name = String(model.name || model.model || '').toLowerCase();
  const family = String(model.details && model.details.family || '').toLowerCase();
  const families = Array.isArray(model.details && model.details.families)
    ? model.details.families.join(' ').toLowerCase()
    : '';
  return [name, family, families].some((value) => (
    value.includes('vision') ||
    value.includes('llava') ||
    value.includes('bakllava') ||
    value.includes('moondream') ||
    value.includes('mllama') ||
    value.includes('vl')
  ));
}

async function fetchOllamaModels() {
  try {
    await startOllamaServer();
    const response = await fetch(`${DEFAULT_OLLAMA_URL}/api/tags`);
    if (!response.ok) return [];
    const json = await response.json();
    const models = Array.isArray(json.models) ? json.models : [];

    return models
      .map((model) => ({
        name: model.name || model.model,
        provider: 'ollama',
        endpoint: DEFAULT_OLLAMA_URL,
        model: model.model || model.name,
        filePath: null,
        source: isLikelyVisionModel(model) ? 'ollama-vision' : 'ollama'
      }))
      .filter((model) => model.name && model.model)
      .sort((a, b) => {
        const aVision = a.source === 'ollama-vision' ? 0 : 1;
        const bVision = b.source === 'ollama-vision' ? 0 : 1;
        return aVision - bVision || a.name.localeCompare(b.name);
      });
  } catch (_error) {
    return [];
  }
}

async function scanModelFolder(folderPath) {
  const targetFolder = await resolveModelFolder(folderPath);
  await fs.mkdir(targetFolder, { recursive: true });
  const [lmStudioModels, ollamaModels, fileModels] = await Promise.all([
    fetchLMStudioModels(),
    fetchOllamaModels(),
    scanModelFiles(targetFolder)
  ]);

  const names = new Set();
  const models = [...lmStudioModels, ...ollamaModels, ...fileModels].filter((model) => {
    const key = `${model.provider}:${model.model}:${model.filePath || ''}`;
    if (names.has(key)) return false;
    names.add(key);
    return true;
  });

  return { folderPath: targetFolder, models };
}

function normalizeBaseUrl(value, fallback) {
  return String(value || fallback).replace(/\/+$/, '');
}

function buildAnalysisPrompt(options = {}) {
  const outputStyle = options.targetModel || options.outputStyle || 'tag';
  const detail = options.detail || 'balanced';
  const nsfwMode = options.nsfwMode || 'adult';
  const customNotes = String(options.customNotes || '').trim();
  const detailLine = {
    concise: 'Keep it efficient but still include the main subject, pose, clothing, environment, lighting, camera angle, color, texture, and mood.',
    balanced: 'Before writing the final prompt, inspect the image element by element: subject identity type, pose, gaze, hands, clothing layers, fabric texture, hair, face, background objects, location, lighting direction, shadow quality, color palette, camera angle, framing, lens feel, depth, mood, and realism level. Write a rich production-ready result from that analysis.',
    exhaustive: 'Perform a meticulous element-by-element visual breakdown before composing the final prompt. Include small visual cues, pose mechanics, hand placement, facial expression, clothing construction, fabric/material texture, body orientation, environment objects, background depth, lighting direction, highlight/shadow behavior, color palette, camera/lens feel, framing, perspective, image quality, noise/grain, realism level, and aesthetic modifiers.'
  }[detail] || 'Write a rich production-ready result.';
  const styleLine = {
    tag: 'Output style: tag prompt. Make "prompt" a dense comma-separated prompt with 60-120 useful tags or short phrases, ordered from subject to expression, pose, clothing, fabric, body orientation, composition, environment, objects, lighting, color, camera, texture, quality, and mood.',
    sentence: 'Output style: sentence prompt. Make "prompt" 5-8 polished natural-language sentences suitable for image generation, with clear subject, expression, pose, clothing, fabric texture, scene, background objects, composition, lighting, camera, color palette, image texture, and mood.',
    system: 'Output style: system prompt. Make "prompt" a structured JSON-like image generation prompt, not prose. Use nested objects and arrays similar to: objective, aspect_ratio, composition, subject, visual_style, lighting, camera, quality_targets, negative_constraints. When facial expressions or repeated panels are visible or requested, include expression/panel objects. Keep keys in English, values descriptive, and make it directly usable as a generation prompt. If possible, put prompt as a real JSON object, not as an escaped string with literal \\n characters.'
  }[outputStyle] || 'Output style: sentence prompt. Make "prompt" detailed and directly usable for image generation.';

  return [
    'You are a local image-to-prompt assistant for generative image models.',
    'Analyze only what is visible in the uploaded image. Do not identify real people by name.',
    'If the image includes sexual or nude content, describe it only when the subject is clearly an adult.',
    'If the subject appears underage or age is ambiguous in sexual context, do not create sexualized prompt text. Return a safety note instead.',
    'Do not assist with non-consensual, exploitative, or hidden-camera sexual content.',
    styleLine,
    `NSFW handling: ${nsfwMode === 'sfw' ? 'convert to a safe-for-work prompt' : 'adult-only NSFW prompt details are allowed when lawful and consensual'}.`,
    detailLine,
    'Do a silent visual checklist before answering: subject, face/expression, gaze, pose, hands, clothing, fabric/material, hair, skin/texture, background, props/objects, lighting, color palette, camera angle, framing, depth, image quality, mood.',
    'Prefer visually useful specificity over generic words. Avoid vague filler such as beautiful, masterpiece, best quality unless it is paired with concrete visual details.',
    'Do not merely caption the image. Convert visual observations into generation-useful prompt language.',
    'The "prompt" value should be substantially descriptive, not a short caption. The "caption" should stay factual and neutral.',
    customNotes ? `User notes: ${customNotes}` : '',
    '',
    'Return valid JSON only with these exact keys:',
    '{',
    '  "safety": {"rating": "sfw|adult|blocked", "reason": "short reason"},',
    '  "caption": "neutral factual image caption",',
    '  "prompt": "main prompt in the selected output style; for system style, this may be a structured JSON object instead of a string",',
    '  "tagPrompt": "detailed comma-separated tag prompt, even when another style is selected",',
    '  "negativePrompt": "comma-separated negative prompt",',
    '  "modelTips": ["short practical prompt/model tips"]',
    '}'
  ].filter(Boolean).join('\n');
}

function buildFallbackPrompt(options = {}) {
  const outputStyle = options.targetModel || options.outputStyle || 'tag';
  const detail = options.detail || 'balanced';
  const nsfwMode = options.nsfwMode || 'adult';
  const customNotes = String(options.customNotes || '').trim();

  return [
    'Look at the uploaded image and create a prompt for an image generation model.',
    `Output style: ${outputStyle}. Use 60-120 detailed tags for "tag", 5-8 descriptive sentences for "sentence", and structured JSON-like image prompt format for "system".`,
    `Detail level: ${detail}.`,
    'Analyze the image element by element before writing. Make the main PROMPT longer than a caption and include subject, expression, gaze, pose, hands, clothing, fabric/material, hair, skin texture, environment, objects, lighting, shadows, camera angle, framing, depth, texture, color palette, mood, and generation-useful style details.',
    `NSFW mode: ${nsfwMode}. Only describe adult sexual content when the subject is clearly adult.`,
    customNotes ? `User notes: ${customNotes}` : '',
    '',
    'Write the answer in this format:',
    'CAPTION: one factual caption',
    'PROMPT: one detailed polished generation prompt in the selected output style. If style is system, write a JSON-like object with keys such as objective, aspect_ratio, composition, subject, visual_style, lighting, camera, quality_targets, negative_constraints',
    'TAGS: detailed comma-separated tags covering subject, expression, pose, clothing, background, lighting, camera, color, texture, mood',
    'NEGATIVE: comma-separated negative prompt',
    'TIPS: short practical tips'
  ].filter(Boolean).join('\n');
}

function extractJson(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) throw new Error('The local model returned an empty response.');

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('The local model did not return JSON. Try a stronger instruction-following model.');
    return JSON.parse(match[0]);
  }
}

function decodeEscapedText(text) {
  return String(text || '')
    .trim()
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .trim();
}

function prettyJsonLikeText(text) {
  const decoded = decodeEscapedText(text);
  if (!/^[\[{]/.test(decoded)) return decoded;
  try {
    return JSON.stringify(JSON.parse(decoded), null, 2);
  } catch (_error) {
    return decoded;
  }
}

function cleanOutputValue(value) {
  if (value && typeof value === 'object') return JSON.stringify(value, null, 2);
  return prettyJsonLikeText(value);
}

function looksLikeSystemPromptObject(text) {
  const value = decodeEscapedText(text);
  return /^\{/.test(value) && /"(objective|composition|subject|visual_style|negative_constraints)"/i.test(value);
}

function normalizeTextResult(text) {
  const value = decodeEscapedText(text);
  if (!value) throw new Error('EMPTY_MODEL_RESPONSE');

  if (looksLikeSystemPromptObject(value)) {
    return {
      safety: {
        rating: 'adult',
        reason: 'Generated by local model. Review before use.'
      },
      caption: '',
      prompt: prettyJsonLikeText(value),
      tagPrompt: '',
      negativePrompt: '',
      modelTips: []
    };
  }

  function jsonField(name) {
    const pattern = new RegExp(`["']${name}["']\\s*:\\s*["']([\\s\\S]*?)["']\\s*(?:,|\\n|\\})`, 'i');
    const match = value.match(pattern);
    return match ? cleanOutputValue(match[1]) : '';
  }

  function section(name) {
    const pattern = new RegExp(`${name}:\\s*([\\s\\S]*?)(?=\\n[A-Z]+:|$)`, 'i');
    const match = value.match(pattern);
    return match ? match[1].trim() : '';
  }

  const caption = section('CAPTION') || jsonField('caption');
  const prompt = section('PROMPT') || jsonField('prompt');
  const tagPrompt = section('TAGS') || jsonField('tagPrompt') || jsonField('tag_prompt');
  const negativePrompt = section('NEGATIVE') || jsonField('negativePrompt') || jsonField('negative_prompt');
  const tips = section('TIPS') || jsonField('modelTips');

  return {
    safety: {
      rating: 'adult',
      reason: 'Generated by local model. Review before use.'
    },
    caption: cleanOutputValue(caption || value.slice(0, 500)),
    prompt: cleanOutputValue(prompt || value),
    tagPrompt: cleanOutputValue(tagPrompt),
    negativePrompt: cleanOutputValue(negativePrompt),
    modelTips: tips ? [tips] : []
  };
}

function readOpenAIContent(json) {
  const message = json.choices && json.choices[0] && json.choices[0].message;
  if (!message) return '';
  const content = message.content;

  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        return item.text || item.content || '';
      })
      .join('\n')
      .trim();
  }

  return '';
}

function normalizeResult(raw) {
  const safety = raw && typeof raw.safety === 'object' ? raw.safety : {};
  return {
    safety: {
      rating: safety.rating || 'adult',
      reason: safety.reason || 'Local model result. Review before use.'
    },
    caption: cleanOutputValue(raw.caption || ''),
    prompt: cleanOutputValue(raw.prompt || ''),
    tagPrompt: cleanOutputValue(raw.tagPrompt || raw.tag_prompt || ''),
    negativePrompt: cleanOutputValue(raw.negativePrompt || raw.negative_prompt || ''),
    modelTips: Array.isArray(raw.modelTips) ? raw.modelTips : []
  };
}

async function postJson(url, body, apiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  } catch (error) {
    throw new Error(`LOCAL_RUNNER_UNREACHABLE ${url} ${error.message}`);
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Local model request failed (${response.status}): ${message.slice(0, 700)}`);
  }

  return response.json();
}

function isModelReloadError(error) {
  return String(error && error.message || error || '').toLowerCase().includes('model reloaded');
}

function isModelCrashError(error) {
  const message = String(error && error.message || error || '').toLowerCase();
  return message.includes('model has crashed') || message.includes('exit code');
}

function isBase64ImageUrlError(error) {
  const message = String(error && error.message || error || '').toLowerCase();
  return message.includes('url') && message.includes('base64 encoded image');
}

function stripDataUrl(value) {
  return String(value || '').replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '');
}

async function runOllama({ baseUrl, model, prompt, imageBase64 }) {
  const ready = await startOllamaServer();
  if (!ready) {
    throw new Error('OLLAMA_NOT_INSTALLED_OR_NOT_STARTED');
  }

  const body = {
    model,
    prompt,
    images: [imageBase64],
    stream: false,
    format: 'json',
    options: {
      temperature: 0.2,
      num_ctx: 8192
    }
  };

  let json;
  try {
    json = await postJson(`${normalizeBaseUrl(baseUrl, DEFAULT_OLLAMA_URL)}/api/generate`, body);
  } catch (error) {
    const message = String(error.message || '');
    if (
      message.includes('no longer compatible') ||
      message.includes('re-download') ||
      message.includes('not found') ||
      message.includes('pull')
    ) {
      await pullOllamaModel(model);
      json = await postJson(`${normalizeBaseUrl(baseUrl, DEFAULT_OLLAMA_URL)}/api/generate`, body);
    } else {
      throw error;
    }
  }

  return normalizeResult(extractJson(json.response));
}

async function runOpenAICompatible({ baseUrl, apiKey, model, prompt, imageDataUrl, fallbackPrompt }) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl, DEFAULT_OPENAI_URL);
  if (normalizedBaseUrl === DEFAULT_OPENAI_URL) {
    const ready = await startLMStudioServer();
    if (!ready) throw new Error('LM_STUDIO_SERVER_NOT_READY');
  }

  async function request(textPrompt, imageUrl = imageDataUrl) {
    const body = {
      model,
      temperature: 0.35,
      max_tokens: 2600,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: textPrompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ]
    };

    try {
      return await postJson(`${normalizedBaseUrl}/chat/completions`, body, apiKey);
    } catch (error) {
      if (isModelReloadError(error)) {
        await wait(1600);
        return postJson(`${normalizedBaseUrl}/chat/completions`, body, apiKey);
      }
      if (isBase64ImageUrlError(error) && imageUrl !== stripDataUrl(imageDataUrl)) {
        return request(textPrompt, stripDataUrl(imageDataUrl));
      }
      if (isModelCrashError(error)) {
        throw new Error(`LM_STUDIO_MODEL_CRASHED ${model}`);
      }
      throw error;
    }
  }

  const first = await request(prompt);
  const firstContent = readOpenAIContent(first);

  if (firstContent.trim()) {
    try {
      return normalizeResult(extractJson(firstContent));
    } catch (_error) {
      return normalizeTextResult(firstContent);
    }
  }

  const second = await request(fallbackPrompt || prompt);
  const secondContent = readOpenAIContent(second);
  return normalizeTextResult(secondContent);
}

async function testOpenAIModel({ baseUrl, apiKey, model }) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl, DEFAULT_OPENAI_URL);
  if (normalizedBaseUrl === DEFAULT_OPENAI_URL) {
    const ready = await startLMStudioServer();
    if (!ready) {
      return {
        status: 'blocked',
        message: 'LM Studio 서버가 준비되지 않았습니다. LM Studio를 열고 모델을 Load한 뒤 다시 테스트하세요.'
      };
    }
  }

  const tinyImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

  async function runOnce(imageUrl = tinyImage) {
    const body = {
      model,
      temperature: 0.1,
      max_tokens: 80,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'This is a connection test. Reply with one short sentence describing the image.' },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ]
    };
    const json = await postJson(`${normalizedBaseUrl}/chat/completions`, body, apiKey);
    return readOpenAIContent(json);
  }

  try {
    let content = '';
    try {
      content = await runOnce();
    } catch (error) {
      if (isBase64ImageUrlError(error)) {
        content = await runOnce(stripDataUrl(tinyImage));
      } else
      if (!isModelReloadError(error)) throw error;
      else {
        await wait(1600);
        content = await runOnce();
      }
    }

    if (!String(content || '').trim()) {
      return {
        status: 'action',
        message: '모델은 응답했지만 내용이 비어 있습니다. 다른 Vision 모델을 선택하거나 LM Studio에서 모델을 다시 Load해 보세요.'
      };
    }

    return {
      status: 'ready',
      message: '모델 테스트 성공. 이 모델은 현재 이미지 입력에 응답했습니다.'
    };
  } catch (error) {
    const message = String(error && error.message || error || '');
    const lower = message.toLowerCase();
    if (isModelCrashError(error)) {
      return {
        status: 'blocked',
        message: '모델이 테스트 중 중단되었습니다. 이 PC/설정에서는 현재 모델이 불안정합니다. LM Studio에서 Unload 후 다시 Load하거나 더 작은 Vision 모델을 선택하세요.'
      };
    }
    if (isModelReloadError(error)) {
      return {
        status: 'action',
        message: 'LM Studio가 모델을 다시 로드했습니다. 잠시 후 테스트를 다시 눌러 주세요.'
      };
    }
    if (lower.includes('unsupported') || lower.includes('image') && lower.includes('support')) {
      return {
        status: 'blocked',
        message: '선택한 모델이 이미지 입력을 지원하지 않는 것 같습니다. Vision/VL 모델을 Load한 뒤 Refresh를 눌러 주세요.'
      };
    }
    if (lower.includes('unreachable') || lower.includes('fetch failed')) {
      return {
        status: 'blocked',
        message: 'LM Studio 서버에 연결하지 못했습니다. LM Studio Local Server가 켜져 있는지 확인하세요.'
      };
    }
    return {
      status: 'blocked',
      message: `모델 테스트 실패: ${message.slice(0, 260)}`
    };
  }
}

async function testOllamaModel({ baseUrl, model }) {
  const ready = await startOllamaServer();
  if (!ready) {
    return {
      status: 'blocked',
      message: 'Ollama 서버가 준비되지 않았습니다. Ollama를 설치하거나 실행한 뒤 다시 테스트하세요.'
    };
  }

  const tinyImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';
  try {
    const json = await postJson(`${normalizeBaseUrl(baseUrl, DEFAULT_OLLAMA_URL)}/api/generate`, {
      model,
      prompt: 'This is a connection test. Reply with one short sentence describing the image.',
      images: [tinyImage],
      stream: false,
      options: {
        temperature: 0.1,
        num_ctx: 1024
      }
    });
    const response = String(json && json.response || '').trim();
    if (!response) {
      return {
        status: 'action',
        message: 'Ollama 모델은 응답했지만 내용이 비어 있습니다. Vision 모델인지 확인하거나 다른 모델을 선택하세요.'
      };
    }
    return {
      status: 'ready',
      message: 'Ollama 모델 테스트 성공. 이 모델은 현재 이미지 입력에 응답했습니다.'
    };
  } catch (error) {
    const message = String(error && error.message || error || '');
    const lower = message.toLowerCase();
    if (lower.includes('does not support images') || lower.includes('vision') || lower.includes('image')) {
      return {
        status: 'blocked',
        message: '선택한 Ollama 모델이 이미지 입력을 지원하지 않는 것 같습니다. llava, bakllava, moondream 같은 Vision 모델을 선택하세요.'
      };
    }
    return {
      status: 'blocked',
      message: `Ollama 모델 테스트 실패: ${message.slice(0, 260)}`
    };
  }
}

ipcMain.handle('images:pick', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle('image:preview', async (_event, filePath) => {
  if (!isImagePath(filePath)) throw new Error('Only JPG, PNG, and WebP images are supported.');
  const bytes = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
  const mime = ext === 'jpg' ? 'jpeg' : ext;
  return `data:image/${mime};base64,${bytes.toString('base64')}`;
});

ipcMain.handle('image:thumbnail', async (_event, filePath) => {
  if (!isImagePath(filePath)) throw new Error('Only JPG, PNG, and WebP images are supported.');
  const bytes = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
  const mime = ext === 'jpg' ? 'jpeg' : ext;
  return `data:image/${mime};base64,${bytes.toString('base64')}`;
});

ipcMain.handle('projects:list', async () => listProjects());

ipcMain.handle('projects:create', async (_event, name) => {
  const project = createEmptyProject(String(name || 'Untitled Project').trim() || 'Untitled Project');
  return saveProject(project);
});

ipcMain.handle('projects:load', async (_event, projectId) => readProject(projectId));

ipcMain.handle('projects:save', async (_event, project) => saveProject(project));

ipcMain.handle('projects:delete', async (_event, projectId) => {
  await fs.rm(projectFilePath(projectId), { force: true });
  await fs.rm(projectAssetFolder(projectId), { recursive: true, force: true });
  return listProjects();
});

ipcMain.handle('projects:export', async (_event, project) => {
  if (!project || !project.id) throw new Error('Project is required.');
  const result = await dialog.showSaveDialog({
    defaultPath: `${project.name || 'Local Prompt Studio Project'}.json`,
    filters: [
      { name: 'Project JSON', extensions: ['json'] }
    ]
  });
  if (result.canceled || !result.filePath) return null;
  await fs.writeFile(result.filePath, JSON.stringify(project, null, 2), 'utf8');
  return result.filePath;
});

ipcMain.handle('projects:import', async () => {
  await ensureProjectsFolder();
  const result = await dialog.showOpenDialog({
    defaultPath: defaultProjectsFolder(),
    properties: ['openFile'],
    filters: [
      { name: 'Project JSON', extensions: ['json'] }
    ]
  });
  if (result.canceled || !result.filePaths[0]) return null;

  const imported = JSON.parse(await fs.readFile(result.filePaths[0], 'utf8'));
  const now = new Date().toISOString();
  const project = {
    ...imported,
    id: createProjectId(),
    name: `${imported.name || 'Imported Project'} Copy`,
    createdAt: now,
    updatedAt: now,
    items: Array.isArray(imported.items) ? imported.items : [],
    activeItemId: imported.activeItemId || null
  };
  return saveProject(project);
});

ipcMain.handle('projects:openFolder', async () => {
  await ensureProjectsFolder();
  await shell.openPath(defaultProjectsFolder());
  return defaultProjectsFolder();
});

ipcMain.handle('projects:addImage', async (_event, payload) => {
  const project = payload && payload.project;
  const filePath = payload && payload.filePath;
  const storageMode = payload && payload.storageMode === 'copy' ? 'copy' : 'reference';
  if (!project || !project.id) throw new Error('Project is required.');
  if (!filePath || !isImagePath(filePath)) throw new Error('Choose a JPG, PNG, or WebP image first.');

  const parsed = path.parse(filePath);
  const itemId = createItemId();
  let savedPath = filePath;
  let originalFilePath = filePath;

  if (storageMode === 'copy') {
    await fs.mkdir(projectAssetFolder(project.id), { recursive: true });
    const assetName = `${itemId}${parsed.ext.toLowerCase()}`;
    savedPath = path.join(projectAssetFolder(project.id), assetName);
    await fs.copyFile(filePath, savedPath);
  }

  const item = {
    id: itemId,
    filePath: savedPath,
    originalFilePath,
    storageMode,
    fileName: path.basename(filePath),
    createdAt: new Date().toISOString(),
    result: null
  };
  const nextProject = {
    ...project,
    items: [...(Array.isArray(project.items) ? project.items : []), item],
    activeItemId: item.id
  };
  return saveProject(nextProject);
});

ipcMain.handle('models:pickFolder', async () => {
  const result = await dialog.showOpenDialog({
    defaultPath: defaultModelFolder(),
    properties: ['openDirectory', 'createDirectory']
  });

  if (result.canceled || !result.filePaths[0]) return null;
  return scanModelFolder(result.filePaths[0]);
});

ipcMain.handle('models:scan', async (_event, folderPath) => scanModelFolder(folderPath));
ipcMain.handle('env:check', async (_event, folderPath) => checkEnvironment(folderPath));
ipcMain.handle('env:prepare', async (_event, folderPath) => prepareLMStudioEnvironment(folderPath));
ipcMain.handle('models:test', async (_event, payload) => {
  const selectedModel = payload && payload.selectedModel && typeof payload.selectedModel === 'object'
    ? payload.selectedModel
    : null;
  const model = String(payload && payload.model || selectedModel && selectedModel.model || '').trim();
  if (!model) {
    return {
      status: 'blocked',
      message: '테스트할 모델이 선택되지 않았습니다.'
    };
  }

  const provider = selectedModel ? selectedModel.provider : payload && payload.provider;
  if (provider === 'ollama') {
    return testOllamaModel({
      baseUrl: payload && payload.baseUrl || selectedModel && selectedModel.endpoint || DEFAULT_OLLAMA_URL,
      model
    });
  }

  return testOpenAIModel({
    baseUrl: payload && payload.baseUrl || selectedModel && selectedModel.endpoint || DEFAULT_OPENAI_URL,
    apiKey: payload && payload.apiKey,
    model
  });
});

ipcMain.handle('models:addFiles', async (_event, folderPath) => {
  const targetFolder = await resolveModelFolder(folderPath);
  await fs.mkdir(targetFolder, { recursive: true });

  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Model files', extensions: ['gguf', 'safetensors', 'bin', 'pt', 'pth', 'onnx'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return scanModelFolder(targetFolder);
  }

  for (const sourcePath of result.filePaths) {
    const fileName = path.basename(sourcePath);
    const destinationPath = path.join(targetFolder, fileName);
    if (path.resolve(sourcePath) === path.resolve(destinationPath)) continue;
    await fs.copyFile(sourcePath, destinationPath);
  }

  return scanModelFolder(targetFolder);
});

ipcMain.handle('prompt:generate', async (_event, payload) => {
  const filePath = payload && payload.filePath;
  if (!filePath || !isImagePath(filePath)) {
    throw new Error('Choose a JPG, PNG, or WebP image first.');
  }

  const selectedModel = payload.selectedModel && typeof payload.selectedModel === 'object'
    ? payload.selectedModel
    : null;
  const provider = selectedModel ? selectedModel.provider : payload.provider || 'ollama';
  const model = String(payload.model || '').trim();
  if (!model) throw new Error('Enter the local model name.');

  if (selectedModel && selectedModel.source === 'file') {
    throw new Error(`RAW_MODEL_FILE_SELECTED ${selectedModel.name}`);
  }

  const providedImageDataUrl = typeof payload.imageDataUrl === 'string' && payload.imageDataUrl.startsWith('data:image/')
    ? payload.imageDataUrl
    : '';
  const preparedImage = providedImageDataUrl
    ? {
      imageBase64: stripDataUrl(providedImageDataUrl),
      imageDataUrl: providedImageDataUrl
    }
    : await readImageForModel(filePath);
  const { imageBase64, imageDataUrl } = preparedImage;
  const prompt = buildAnalysisPrompt(payload.options || {});
  const fallbackPrompt = buildFallbackPrompt(payload.options || {});

  if (provider === 'openai') {
    return runOpenAICompatible({
      baseUrl: payload.baseUrl,
      apiKey: payload.apiKey,
      model,
      prompt,
      fallbackPrompt,
      imageDataUrl
    });
  }

  return runOllama({
    baseUrl: payload.baseUrl,
    model,
    prompt,
    imageBase64
  });
});
