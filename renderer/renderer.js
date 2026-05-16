const state = {
  projects: [],
  project: null,
  activeItem: null,
  previewDataUrl: null,
  modelFolderPath: null,
  models: [],
  selectedModel: null,
  activeHistoryId: null
};

const thumbnailCache = new Map();

const dropZone = document.getElementById('dropZone');
const emptyPreview = document.getElementById('emptyPreview');
const previewImage = document.getElementById('previewImage');
const newProjectButton = document.getElementById('newProject');
const refreshProjectsButton = document.getElementById('refreshProjects');
const importProjectButton = document.getElementById('importProject');
const openProjectsFolderButton = document.getElementById('openProjectsFolder');
const checkUpdatesButton = document.getElementById('checkUpdates');
const saveProjectButton = document.getElementById('saveProject');
const renameProjectButton = document.getElementById('renameProject');
const exportProjectButton = document.getElementById('exportProject');
const deleteProjectButton = document.getElementById('deleteProject');
const projectList = document.getElementById('projectList');
const itemList = document.getElementById('itemList');
const projectTitle = document.getElementById('projectTitle');
const projectMeta = document.getElementById('projectMeta');
const copyImagesInput = document.getElementById('copyImages');
const checkEnvironmentButton = document.getElementById('checkEnvironment');
const prepareEnvironmentButton = document.getElementById('prepareEnvironment');
const refreshModelsButton = document.getElementById('refreshModels');
const modelFolderPath = document.getElementById('modelFolderPath');
const modelList = document.getElementById('modelList');
const modelHint = document.getElementById('modelHint');
const envReport = document.getElementById('envReport');
const targetModelSelect = document.getElementById('targetModel');
const detailSelect = document.getElementById('detail');
const customNotesInput = document.getElementById('customNotes');
const settingsForm = document.getElementById('settings');
const generateButton = document.getElementById('generate');
const statusText = document.getElementById('status');
const safetyBadge = document.getElementById('safetyBadge');
const historyList = document.getElementById('historyList');
const output = document.getElementById('output');
const copyOutputButton = document.getElementById('copyOutput');
const tips = document.getElementById('tips');
const setupDialog = document.getElementById('setupDialog');
const setupTitle = document.getElementById('setupTitle');
const setupBody = document.getElementById('setupBody');
const closeSetupDialogButton = document.getElementById('closeSetupDialog');
const dismissSetupDialogButton = document.getElementById('dismissSetupDialog');
const prepareFromDialogButton = document.getElementById('prepareFromDialog');

function setStatus(message, type = '') {
  statusText.textContent = message;
  statusText.className = `status ${type}`.trim();
}

function basename(value) {
  return String(value || '').split(/[\\/]/).pop();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getNsfwMode() {
  const selected = document.querySelector('input[name="nsfwMode"]:checked');
  return selected ? selected.value : 'adult';
}

function createHistoryId() {
  return `history-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function outputStyleLabel(value) {
  return {
    tag: '태그형',
    sentence: '문장형',
    system: '시스템형'
  }[value] || value || '결과';
}

function getResultHistory(item) {
  if (!item) return [];
  if (Array.isArray(item.history) && item.history.length) return item.history;
  if (item.result) {
    return [{
      id: 'legacy-result',
      createdAt: item.updatedAt || item.createdAt || new Date().toISOString(),
      outputStyle: 'legacy',
      detail: '',
      result: item.result
    }];
  }
  return [];
}

function activeHistoryEntry() {
  const history = getResultHistory(state.activeItem);
  if (!history.length) return null;
  return history.find((entry) => entry.id === state.activeHistoryId) || history[history.length - 1];
}

function activeResult() {
  const entry = activeHistoryEntry();
  if (entry && entry.result) return entry.result;
  return state.activeItem && state.activeItem.result ? state.activeItem.result : null;
}

function renderProjects() {
  projectList.innerHTML = state.projects.length
    ? state.projects.map((project) => `
      <div class="project-row ${state.project && state.project.id === project.id ? 'is-active' : ''}" data-project-id="${project.id}">
        <input class="project-name-input" data-rename-project-id="${project.id}" value="${escapeHtml(project.name || 'Untitled Project')}" aria-label="프로젝트 이름">
        <small>${project.itemCount || 0} images</small>
      </div>
    `).join('')
    : '<div class="empty-list">프로젝트가 없습니다.</div>';
}

function renderProjectHeader() {
  if (!state.project) {
    projectTitle.textContent = '프로젝트 없음';
    projectMeta.textContent = '새 프로젝트를 만들거나 기존 프로젝트를 선택하세요.';
    return;
  }

  projectTitle.textContent = state.project.name || 'Untitled Project';
  projectMeta.textContent = `${state.project.items.length}개 이미지 · ${new Date(state.project.updatedAt || Date.now()).toLocaleString()}`;
}

async function loadThumbnail(filePath) {
  if (!filePath) return '';
  if (thumbnailCache.has(filePath)) return thumbnailCache.get(filePath);
  try {
    const dataUrl = await window.promptStudio.loadThumbnail(filePath);
    thumbnailCache.set(filePath, dataUrl);
    return dataUrl;
  } catch (_error) {
    return '';
  }
}

async function renderItems() {
  if (!state.project || state.project.items.length === 0) {
    itemList.innerHTML = '<div class="empty-list">이미지를 드롭하면 여기에 쌓입니다.</div>';
    return;
  }

  const thumbs = await Promise.all(state.project.items.map((item) => loadThumbnail(item.filePath)));
  itemList.innerHTML = state.project.items.map((item, index) => `
    <button class="item-row ${state.activeItem && state.activeItem.id === item.id ? 'is-active' : ''}" data-item-id="${item.id}" type="button">
      <span class="thumb">${thumbs[index] ? `<img src="${thumbs[index]}" alt="">` : ''}</span>
      <span class="item-title">${escapeHtml(item.fileName || basename(item.filePath))}</span>
      <small>${item.result ? 'prompt saved' : 'waiting'} · ${item.storageMode === 'copy' ? 'copied' : 'linked'}</small>
      <span class="delete-item" data-delete-item-id="${item.id}" title="삭제">×</span>
    </button>
  `).join('');
}

async function renderActiveImage() {
  if (!state.activeItem) {
    previewImage.hidden = true;
    previewImage.removeAttribute('src');
    emptyPreview.hidden = false;
    dropZone.classList.remove('has-image');
    renderOutput();
    return;
  }

  const dataUrl = await window.promptStudio.loadPreview(state.activeItem.filePath);
  state.previewDataUrl = dataUrl;
  previewImage.src = dataUrl;
  previewImage.hidden = false;
  emptyPreview.hidden = true;
  dropZone.classList.add('has-image');
  state.activeHistoryId = state.activeItem.activeHistoryId || (getResultHistory(state.activeItem).at(-1) || {}).id || null;
  setSafetyBadge(activeResult() ? activeResult().safety : null);
  renderOutput();
}

function renderAll() {
  renderProjects();
  renderProjectHeader();
  renderItems();
}

async function loadProjects() {
  state.projects = await window.promptStudio.listProjects();
  renderProjects();
}

async function createProject() {
  const project = await window.promptStudio.createProject(`Project ${new Date().toLocaleDateString()}`);
  state.project = project;
  state.activeItem = null;
  await loadProjects();
  renderAll();
  await renderActiveImage();
  setStatus('새 프로젝트를 만들었습니다. 이미지를 드롭하세요.', 'ok');
}

async function loadProject(projectId) {
  state.project = await window.promptStudio.loadProject(projectId);
  const activeItemId = state.project.activeItemId;
  state.activeItem = state.project.items.find((item) => item.id === activeItemId) || state.project.items[0] || null;
  renderAll();
  await renderActiveImage();
  setStatus('프로젝트를 불러왔습니다.', 'ok');
}

async function saveCurrentProject() {
  if (!state.project) {
    setStatus('저장할 프로젝트가 없습니다.', 'error');
    return;
  }
  saveProjectButton.disabled = true;
  const previousLabel = saveProjectButton.textContent;
  saveProjectButton.textContent = '저장 중';
  state.project.activeItemId = state.activeItem ? state.activeItem.id : null;
  try {
    state.project = await window.promptStudio.saveProject(state.project);
    await loadProjects();
    renderAll();
    setStatus('프로젝트를 저장했습니다.', 'ok');
  } catch (error) {
    setStatus(`저장 실패: ${error.message}`, 'error');
  } finally {
    saveProjectButton.disabled = false;
    saveProjectButton.textContent = previousLabel;
  }
}

async function renameCurrentProject() {
  if (!state.project) return;
  const nextName = window.prompt('프로젝트 이름', state.project.name || 'Untitled Project');
  if (!nextName) return;
  state.project.name = nextName.trim() || state.project.name;
  await saveCurrentProject();
}

async function renameProjectById(projectId, nextName) {
  const cleanName = String(nextName || '').trim();
  if (!cleanName) return;
  const targetProject = state.project && state.project.id === projectId
    ? state.project
    : await window.promptStudio.loadProject(projectId);
  targetProject.name = cleanName;
  const saved = await window.promptStudio.saveProject(targetProject);
  if (state.project && state.project.id === projectId) state.project = saved;
  await loadProjects();
  renderAll();
  setStatus('프로젝트 이름을 변경했습니다.', 'ok');
}

async function deleteCurrentProject() {
  if (!state.project) return;
  const ok = window.confirm(`"${state.project.name}" 프로젝트를 삭제할까요?`);
  if (!ok) return;
  await window.promptStudio.deleteProject(state.project.id);
  state.project = null;
  state.activeItem = null;
  await loadProjects();
  if (state.projects[0]) await loadProject(state.projects[0].id);
  else {
    renderAll();
    await renderActiveImage();
  }
  setStatus('프로젝트를 삭제했습니다.', 'ok');
}

async function exportCurrentProject() {
  if (!state.project) return;
  const filePath = await window.promptStudio.exportProject(state.project);
  if (filePath) setStatus('프로젝트를 내보냈습니다.', 'ok');
}

async function importProject() {
  const project = await window.promptStudio.importProject();
  if (!project) return;
  await loadProjects();
  await loadProject(project.id);
  setStatus('프로젝트를 가져왔습니다.', 'ok');
}

async function deleteItem(itemId) {
  if (!state.project) return;
  const item = state.project.items.find((entry) => entry.id === itemId);
  if (!item) return;
  const ok = window.confirm(`"${item.fileName || 'image'}" 작업을 삭제할까요?`);
  if (!ok) return;
  state.project.items = state.project.items.filter((entry) => entry.id !== itemId);
  state.activeItem = state.project.items[0] || null;
  state.project.activeItemId = state.activeItem ? state.activeItem.id : null;
  await saveCurrentProject();
  renderAll();
  await renderActiveImage();
  setStatus('이미지 작업을 삭제했습니다.', 'ok');
}

async function addImage(filePath) {
  if (!filePath) return;
  if (!state.project) await createProject();
  state.project = await window.promptStudio.addImageToProject({
    project: state.project,
    filePath,
    storageMode: copyImagesInput.checked ? 'copy' : 'reference'
  });
  state.activeItem = state.project.items.find((item) => item.id === state.project.activeItemId);
  await loadProjects();
  renderAll();
  await renderActiveImage();
  setStatus('이미지를 프로젝트에 추가했습니다.', 'ok');
}

function renderModels() {
  const previousModel = state.selectedModel ? state.selectedModel.model : null;
  const visibleModels = state.models.filter((model) => model.source === 'lmstudio-loaded');
  const runnableModels = visibleModels.filter((model) => isRunnableModel(model));
  modelList.innerHTML = '';

  if (runnableModels.length === 0 && visibleModels.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'LM Studio에서 모델을 로드한 뒤 Refresh를 누르세요';
    modelList.appendChild(option);
    state.selectedModel = null;
    modelHint.textContent = '기본 보기에는 LM Studio에 로드된 모델만 표시합니다.';
    return;
  }

  visibleModels.forEach((model) => {
    const option = document.createElement('option');
    option.value = state.models.indexOf(model).toString();
    option.textContent = displayModelName(model);
    option.disabled = !isRunnableModel(model);
    modelList.appendChild(option);
  });

  const selectedModel = runnableModels.find((model) => model.model === previousModel) || pickBestRunnableModel();
  const globalIndex = state.models.indexOf(selectedModel);
  modelList.value = String(globalIndex);
  state.selectedModel = selectedModel;
  updateModelHint();
}

function isRunnableModel(model) {
  return model && model.source !== 'file' && model.provider === 'openai';
}

function isVisionModel(model) {
  const value = `${model.source || ''} ${model.name || ''} ${model.model || ''}`.toLowerCase();
  return value.includes('vision') || value.includes('vl') || value.includes('qwen') || value.includes('llava') || value.includes('mllama');
}

function displayModelName(model) {
  const badge = !isRunnableModel(model)
    ? '파일 보관됨'
    : model.source === 'lmstudio-loaded' ? 'LM Studio loaded'
      : isVisionModel(model) ? 'vision' : 'text';
  return `${model.name} · ${badge}`;
}

function pickBestRunnableModel() {
  const candidates = state.models.filter((model) => isRunnableModel(model));
  return candidates.find((model) => model.source === 'lmstudio-loaded' && model.model.toLowerCase().includes('hauhaucs')) ||
    candidates.find((model) => model.source === 'lmstudio-loaded' && model.model.toLowerCase().includes('qwen3.6')) ||
    candidates.find((model) => model.source === 'lmstudio-loaded') ||
    null;
}

function updateModelHint() {
  if (!state.selectedModel) {
    modelHint.textContent = 'LM Studio에서 모델을 로드한 뒤 Refresh를 누르세요.';
    return;
  }
  modelHint.textContent = `LM Studio에 로드된 모델입니다. 생성 시 서버를 자동으로 켭니다. · ${state.selectedModel.model}`;
}

async function loadModelFolder(folderPath = null) {
  const result = await window.promptStudio.scanModelFolder(folderPath);
  state.modelFolderPath = result.folderPath;
  state.models = result.models || [];
  modelFolderPath.textContent = '모델 다운로드/추가/로드는 LM Studio에서 관리합니다.';
  renderModels();
}

function setSafetyBadge(safety) {
  if (!safety) {
    safetyBadge.textContent = '대기';
    safetyBadge.className = 'badge';
    return;
  }
  safetyBadge.textContent = `${safety.rating || 'unknown'} · ${safety.reason || ''}`;
  safetyBadge.className = `badge ${safety.rating || ''}`.trim();
}

function getActiveValue() {
  const result = activeResult();
  if (!result) return '';
  return result.prompt || result.tagPrompt || result.caption || '';
}

function renderHistory() {
  const history = getResultHistory(state.activeItem);
  if (!history.length) {
    historyList.innerHTML = '<div class="empty-list">아직 생성된 결과가 없습니다.</div>';
    return;
  }

  const activeEntry = activeHistoryEntry();
  historyList.innerHTML = history.map((entry, index) => {
    const result = entry.result || {};
    const preview = result.prompt || result.tagPrompt || result.caption || '결과';
    return `
      <button class="history-entry ${activeEntry && activeEntry.id === entry.id ? 'is-active' : ''}" data-history-id="${entry.id}" type="button" title="${escapeHtml(preview)}">
        <strong>${escapeHtml(outputStyleLabel(entry.outputStyle) || `결과 ${index + 1}`)}</strong>
        <small>${escapeHtml(new Date(entry.createdAt || Date.now()).toLocaleTimeString())}</small>
      </button>
    `;
  }).join('');
}

function decodeDisplayValue(value) {
  const text = String(value || '')
    .trim()
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .trim();
  if (!/^[\[{]/.test(text)) return text;
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch (_error) {
    return text;
  }
}

function renderTips() {
  const result = activeResult();
  const items = result && Array.isArray(result.modelTips) ? result.modelTips : [];
  tips.innerHTML = items.length ? items.map((item) => `<span>${escapeHtml(item)}</span>`).join('') : '';
}

function renderOutput() {
  renderHistory();
  output.value = decodeDisplayValue(getActiveValue());
  renderTips();
}

function writeActiveOutput(value) {
  if (!state.activeItem || !state.activeItem.result) return;
  const entry = activeHistoryEntry();
  const result = entry && entry.result ? entry.result : state.activeItem.result;
  result.prompt = value;
  if (entry && Array.isArray(state.activeItem.history)) {
    state.activeItem.history = state.activeItem.history.map((item) => item.id === entry.id ? { ...item, result } : item);
  }
  state.activeItem.result = result;
  state.project.items = state.project.items.map((item) => item.id === state.activeItem.id ? state.activeItem : item);
}

function renderEnvironmentReport(report) {
  if (!report) {
    envReport.hidden = true;
    envReport.innerHTML = '';
    return;
  }
  envReport.hidden = false;
  envReport.className = `env-report ${report.status || ''}`.trim();
  envReport.innerHTML = `
    <strong>${escapeHtml(report.recommendation)}</strong>
    <div class="check-grid">
      ${report.checks.map((item) => `
        <span class="${item.ok ? 'ok' : 'warn'}">${item.ok ? 'OK' : '필요'}</span>
        <span>${escapeHtml(item.label)}</span>
        <small>${escapeHtml(item.detail)}</small>
      `).join('')}
    </div>
  `;
}

function setupDialogContent(report = null, reason = '') {
  const checks = report && Array.isArray(report.checks) ? report.checks : [];
  const missing = checks.filter((item) => !item.ok).map((item) => item.label);
  const loadedModels = report && report.models && report.models.lmStudioLoaded ? report.models.lmStudioLoaded : [];
  return `
    <p>${escapeHtml(reason || report && report.recommendation || 'LM Studio 설정을 먼저 완료해야 합니다.')}</p>
    <ol>
      <li>LM Studio를 설치합니다.</li>
      <li>LM Studio에서 비전 모델을 다운로드하거나 GGUF를 import합니다.</li>
      <li>필요한 경우 mmproj/projector 파일을 연결합니다.</li>
      <li>LM Studio에서 모델을 Load 합니다.</li>
      <li>이 앱에서 Refresh를 누릅니다.</li>
    </ol>
    ${missing.length ? `<p><strong>필요한 항목:</strong> ${escapeHtml(missing.join(', '))}</p>` : ''}
    ${loadedModels.length ? `<p><strong>로드된 모델:</strong> ${escapeHtml(loadedModels.join(', '))}</p>` : ''}
  `;
}

function showSetupDialog(report = null, reason = '') {
  setupTitle.textContent = 'LM Studio 준비가 필요합니다';
  setupBody.innerHTML = setupDialogContent(report, reason);
  if (typeof setupDialog.showModal === 'function') setupDialog.showModal();
  else setupDialog.setAttribute('open', '');
}

function closeSetupDialog() {
  if (setupDialog.open && typeof setupDialog.close === 'function') setupDialog.close();
  else setupDialog.removeAttribute('open');
}

function friendlyError(error) {
  const message = String(error && error.message || error || '');
  if (message.includes('LM_STUDIO_SERVER_NOT_READY')) return 'LM Studio 서버를 자동으로 켜지 못했습니다. LM Studio 앱을 한 번 열고 다시 생성해 주세요.';
  if (message.includes('EMPTY_MODEL_RESPONSE')) return '모델이 빈 답변을 반환했습니다. LM Studio에서 vision/projector 설정을 확인해 주세요.';
  return '프롬프트 생성에 실패했습니다. 환경 체크 후 모델을 다시 선택해 주세요.';
}

async function generatePrompt(event) {
  event.preventDefault();
  if (!state.activeItem) {
    setStatus('먼저 이미지를 작업공간에 드롭하세요.', 'error');
    return;
  }
  if (!state.selectedModel) {
    state.selectedModel = pickBestRunnableModel();
    if (!state.selectedModel) {
      setStatus('LM Studio에서 로드된 모델이 없습니다.', 'error');
      showSetupDialog(null, 'LM Studio에 로드된 모델이 없습니다.');
      return;
    }
  }

  generateButton.disabled = true;
  setStatus('모델 실행기를 자동으로 연결하고 이미지를 분석하는 중입니다...');
  try {
    const result = await window.promptStudio.generatePrompt({
      filePath: state.activeItem.filePath,
      provider: state.selectedModel.provider,
      baseUrl: state.selectedModel.endpoint,
      model: state.selectedModel.model,
      selectedModel: state.selectedModel,
      options: {
        targetModel: targetModelSelect.value,
        detail: detailSelect.value,
        nsfwMode: getNsfwMode(),
        customNotes: customNotesInput.value
      }
    });
    const historyEntry = {
      id: createHistoryId(),
      createdAt: new Date().toISOString(),
      outputStyle: targetModelSelect.value,
      detail: detailSelect.value,
      model: state.selectedModel.model,
      result
    };
    const previousHistory = Array.isArray(state.activeItem.history) && state.activeItem.history.length
      ? state.activeItem.history
      : getResultHistory(state.activeItem);
    state.activeItem.history = [...previousHistory, historyEntry];
    state.activeItem.activeHistoryId = historyEntry.id;
    state.activeHistoryId = historyEntry.id;
    state.activeItem.result = result;
    state.project.items = state.project.items.map((item) => item.id === state.activeItem.id ? state.activeItem : item);
    await saveCurrentProject();
    setSafetyBadge(result.safety);
    renderOutput();
    renderItems();
    setStatus('프롬프트 생성 후 프로젝트에 저장했습니다.', 'ok');
  } catch (error) {
    setStatus(friendlyError(error), 'error');
  } finally {
    generateButton.disabled = false;
  }
}

newProjectButton.addEventListener('click', createProject);
refreshProjectsButton.addEventListener('click', loadProjects);
saveProjectButton.addEventListener('click', saveCurrentProject);
renameProjectButton.addEventListener('click', renameCurrentProject);
deleteProjectButton.addEventListener('click', deleteCurrentProject);
exportProjectButton.addEventListener('click', exportCurrentProject);
importProjectButton.addEventListener('click', importProject);
openProjectsFolderButton.addEventListener('click', async () => {
  const folderPath = await window.promptStudio.openProjectsFolder();
  setStatus(`프로젝트 폴더를 열었습니다: ${folderPath}`, 'ok');
});

checkUpdatesButton.addEventListener('click', async () => {
  checkUpdatesButton.disabled = true;
  setStatus('업데이트를 확인하는 중입니다...');
  try {
    const result = await window.promptStudio.checkForUpdates();
    setStatus(result.message, result.status === 'dev' ? '' : 'ok');
  } catch (error) {
    setStatus(`업데이트 확인 실패: ${error.message}`, 'error');
  } finally {
    checkUpdatesButton.disabled = false;
  }
});

projectList.addEventListener('click', async (event) => {
  if (event.target.matches('[data-rename-project-id]')) return;
  const row = event.target.closest('[data-project-id]');
  if (!row) return;
  await loadProject(row.dataset.projectId);
});

projectList.addEventListener('change', async (event) => {
  const input = event.target.closest('[data-rename-project-id]');
  if (!input) return;
  await renameProjectById(input.dataset.renameProjectId, input.value);
});

projectList.addEventListener('keydown', async (event) => {
  const input = event.target.closest('[data-rename-project-id]');
  if (!input) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    input.blur();
  }
});

itemList.addEventListener('click', async (event) => {
  const deleteButton = event.target.closest('[data-delete-item-id]');
  if (deleteButton) {
    event.stopPropagation();
    await deleteItem(deleteButton.dataset.deleteItemId);
    return;
  }

  const row = event.target.closest('[data-item-id]');
  if (!row || !state.project) return;
  state.activeItem = state.project.items.find((item) => item.id === row.dataset.itemId);
  state.project.activeItemId = state.activeItem ? state.activeItem.id : null;
  state.activeHistoryId = state.activeItem ? state.activeItem.activeHistoryId || (getResultHistory(state.activeItem).at(-1) || {}).id || null : null;
  renderAll();
  await renderActiveImage();
});

checkEnvironmentButton.addEventListener('click', async () => {
  checkEnvironmentButton.disabled = true;
  setStatus('LM Studio 실행 환경을 확인하는 중입니다...');
  try {
    const report = await window.promptStudio.checkEnvironment(state.modelFolderPath);
    renderEnvironmentReport(report);
    setStatus('환경 체크가 완료되었습니다.', report.status === 'ready' ? 'ok' : '');
    if (report.status !== 'ready') showSetupDialog(report);
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    checkEnvironmentButton.disabled = false;
  }
});

prepareEnvironmentButton.addEventListener('click', async () => {
  prepareEnvironmentButton.disabled = true;
  try {
    setStatus('LM Studio 설치/서버 상태를 자동으로 준비하는 중입니다...');
    const report = await window.promptStudio.prepareEnvironment(state.modelFolderPath);
    renderEnvironmentReport(report);
    await loadModelFolder(state.modelFolderPath);
    setStatus('자동 준비가 끝났습니다. 모델 목록을 확인하세요.', report.status === 'ready' ? 'ok' : '');
    if (report.status !== 'ready') showSetupDialog(report);
  } catch (error) {
    setStatus(error.message, 'error');
    showSetupDialog(null, '자동 준비 중 문제가 생겼습니다. LM Studio를 직접 설치하거나 실행한 뒤 다시 시도해 주세요.');
  } finally {
    prepareEnvironmentButton.disabled = false;
  }
});

refreshModelsButton.addEventListener('click', async () => {
  await loadModelFolder(state.modelFolderPath);
});

modelList.addEventListener('change', () => {
  const index = Number(modelList.value);
  state.selectedModel = Number.isFinite(index) ? state.models[index] : null;
  updateModelHint();
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('over');
});

dropZone.addEventListener('drop', async (event) => {
  event.preventDefault();
  dropZone.classList.remove('over');
  const [file] = [...event.dataTransfer.files];
  await addImage(file && file.path);
});

settingsForm.addEventListener('submit', generatePrompt);

historyList.addEventListener('click', async (event) => {
  const entry = event.target.closest('[data-history-id]');
  if (!entry || !state.activeItem) return;
  state.activeHistoryId = entry.dataset.historyId;
  state.activeItem.activeHistoryId = state.activeHistoryId;
  const selectedResult = activeResult();
  if (selectedResult) state.activeItem.result = selectedResult;
  state.project.items = state.project.items.map((item) => item.id === state.activeItem.id ? state.activeItem : item);
  renderOutput();
  setSafetyBadge(selectedResult ? selectedResult.safety : null);
  await saveCurrentProject();
});

copyOutputButton.addEventListener('click', async () => {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  setStatus('현재 탭 내용을 복사했습니다.', 'ok');
});

output.addEventListener('input', () => {
  writeActiveOutput(output.value);
});

output.addEventListener('blur', saveCurrentProject);

closeSetupDialogButton.addEventListener('click', closeSetupDialog);
dismissSetupDialogButton.addEventListener('click', closeSetupDialog);
prepareFromDialogButton.addEventListener('click', () => {
  closeSetupDialog();
  prepareEnvironmentButton.click();
});

window.promptStudio.onUpdateStatus((payload) => {
  if (!payload || !payload.message) return;
  setStatus(payload.message, payload.status === 'error' ? 'error' : payload.status === 'current' ? 'ok' : '');
});

(async function init() {
  await loadProjects();
  if (state.projects[0]) await loadProject(state.projects[0].id);
  else renderAll();
  await loadModelFolder(localStorage.getItem('modelFolderPath'));
})();
