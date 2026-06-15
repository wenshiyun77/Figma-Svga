const UI_SIZE = { width: 1120, height: 780 };
const UI_MIN_SIZE = { width: 360, height: 56 };
const UI_MAX_SIZE = { width: 2400, height: 1600 };
const UI_MINIMIZED_OFFSET = { right: 96, bottom: 64 };
const DEFAULT_EXPORT_SCALE = 1;
const FREE_EXPORT_LIMIT = 10;
const LICENSE_STORAGE_KEY = "svga-editor-license-v1";
const LICENSE_PRODUCT_ID = "figma-svga-editor";
let fallbackLicenseStorage = null;
let licenseStorageMode = "clientStorage";
let restoreUiCanvasPosition = null;

figma.showUI(__html__, {
  width: UI_SIZE.width,
  height: UI_SIZE.height,
  themeColors: true,
});

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
};

const sanitizeKey = (value, fallback) => {
  const raw = String(value || fallback || "layer")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return raw || fallback || "layer";
};

const nodeCanExport = (node) =>
  node &&
  typeof node.exportAsync === "function" &&
  node.visible !== false &&
  Boolean(node.absoluteBoundingBox);

const getExportableSelection = () =>
  figma.currentPage.selection.filter((node) => nodeCanExport(node));

const CANVAS_NODE_TYPES = new Set([
  "FRAME",
  "COMPONENT",
  "COMPONENT_SET",
  "INSTANCE",
  "SECTION",
]);

const FLATTENED_CONTAINER_TYPES = new Set([
  "FRAME",
  "GROUP",
  "COMPONENT",
  "COMPONENT_SET",
  "INSTANCE",
  "SECTION",
]);

const VECTOR_NODE_TYPES = new Set([
  "VECTOR",
  "BOOLEAN_OPERATION",
  "LINE",
]);

const SHAPE_NODE_TYPES = new Set([
  "RECTANGLE",
  "ELLIPSE",
  "POLYGON",
  "STAR",
]);

const nodeCanBeCanvas = (node) =>
  node &&
  CANVAS_NODE_TYPES.has(node.type) &&
  Boolean(node.absoluteBoundingBox);

const nodeHasChildren = (node) => Boolean(node && Array.isArray(node.children));

const canRepositionUi = () => typeof figma.ui.reposition === "function";

const getUiCanvasPosition = () => {
  if (typeof figma.ui.getPosition !== "function") return null;
  try {
    return figma.ui.getPosition().canvasSpace;
  } catch (_error) {
    return null;
  }
};

const minimizedUiCanvasPosition = (width, height) => {
  const bounds = figma.viewport.bounds;
  const zoom = Math.max(0.01, Number(figma.viewport.zoom || 1));
  return {
    x: bounds.x + bounds.width - (width + UI_MINIMIZED_OFFSET.right) / zoom,
    y: bounds.y + bounds.height - (height + UI_MINIMIZED_OFFSET.bottom) / zoom,
  };
};

const nodeShouldFlattenForImport = (node) =>
  nodeHasChildren(node) && FLATTENED_CONTAINER_TYPES.has(node.type);

const nodeHasImageFill = (node) => {
  const fills = node && Array.isArray(node.fills) ? node.fills : [];
  return fills.some((fill) => fill && fill.type === "IMAGE" && fill.visible !== false);
};

const inferFigmaAssetKind = (node) => {
  if (!node) return "layer";
  if (node.type === "TEXT") return "text";
  if (nodeHasImageFill(node)) return "image";
  if (VECTOR_NODE_TYPES.has(node.type)) return "vector";
  if (SHAPE_NODE_TYPES.has(node.type)) return "shape";
  if (nodeShouldFlattenForImport(node)) return "container";
  return "layer";
};

const pushUniqueNode = (nodes, node, ids) => {
  if (!node || !node.id || ids.has(node.id)) return;
  nodes.push(node);
  ids.add(node.id);
};

const collectExportableDescendants = (node, nodes, ids) => {
  if (!nodeHasChildren(node)) return;
  for (const child of node.children) {
    if (!child || child.visible === false) continue;
    if (nodeShouldFlattenForImport(child)) {
      const beforeCount = nodes.length;
      collectExportableDescendants(child, nodes, ids);
      if (nodes.length === beforeCount && nodeCanExport(child)) {
        pushUniqueNode(nodes, child, ids);
      }
      continue;
    }
    if (nodeCanExport(child)) pushUniqueNode(nodes, child, ids);
  }
};

const getExportableDescendants = (node) => {
  const nodes = [];
  const ids = new Set();
  collectExportableDescendants(node, nodes, ids);
  return nodes;
};

const getExportableChildren = (node) => getExportableDescendants(node);

const getImportableAssetNodes = (nodes) => {
  const assetNodes = [];
  const ids = new Set();
  for (const node of nodes) {
    if (!node || node.visible === false) continue;
    if (nodeShouldFlattenForImport(node)) {
      const beforeCount = assetNodes.length;
      collectExportableDescendants(node, assetNodes, ids);
      if (assetNodes.length === beforeCount && nodeCanExport(node)) {
        pushUniqueNode(assetNodes, node, ids);
      }
      continue;
    }
    if (nodeCanExport(node)) pushUniqueNode(assetNodes, node, ids);
  }
  return assetNodes;
};

const getSelectionBounds = (nodes) => {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const box = node.absoluteBoundingBox;
    if (!box) continue;
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
};

const getAncestorCanvasChain = (node) => {
  const chain = [];
  let current = node && node.parent ? node.parent : null;
  while (current && current.type !== "PAGE" && current.type !== "DOCUMENT") {
    if (nodeCanBeCanvas(current)) chain.push(current);
    current = current.parent || null;
  }
  return chain;
};

const getCommonCanvasAncestor = (nodes) => {
  if (nodes.length === 0) return null;
  const firstNode = nodes[0];
  const rest = nodes.slice(1);
  const firstChain = getAncestorCanvasChain(firstNode);
  for (const candidate of firstChain) {
    if (
      rest.every((node) =>
        getAncestorCanvasChain(node).some((ancestor) => ancestor.id === candidate.id),
      )
    ) {
      return candidate;
    }
  }
  return null;
};

const isDescendantOf = (node, ancestor) => {
  let current = node && node.parent ? node.parent : null;
  while (current && current.type !== "DOCUMENT") {
    if (current.id === ancestor.id) return true;
    current = current.parent || null;
  }
  return false;
};

const createImportPlan = () => {
  const selection = getExportableSelection();
  if (selection.length === 0) {
    return {
      mode: "empty",
      canvasNode: null,
      canvasBounds: null,
      assetNodes: [],
      selection,
    };
  }

  const selectedCanvasNodes = selection.filter(
    (node) => nodeCanBeCanvas(node) && nodeHasChildren(node),
  );
  if (selectedCanvasNodes.length === 1) {
    const canvasNode = selectedCanvasNodes[0];
    const selectedDescendants = selection.filter((node) => node.id !== canvasNode.id);
    if (selectedDescendants.every((node) => isDescendantOf(node, canvasNode))) {
      return {
        mode:
          selectedDescendants.length > 0
            ? "selected-canvas-with-selection"
            : "selected-canvas",
        canvasNode,
        canvasBounds: canvasNode.absoluteBoundingBox,
        assetNodes:
          selectedDescendants.length > 0
            ? getImportableAssetNodes(selectedDescendants)
            : getExportableDescendants(canvasNode),
        selection,
      };
    }
  }

  const singleSelection = selection.length === 1 ? selection[0] : null;
  if (singleSelection && nodeCanBeCanvas(singleSelection) && nodeHasChildren(singleSelection)) {
    const canvasBounds = singleSelection.absoluteBoundingBox;
    const assetNodes = getExportableDescendants(singleSelection);
    return {
      mode: "selected-canvas",
      canvasNode: singleSelection,
      canvasBounds,
      assetNodes,
      selection,
    };
  }

  const commonCanvas = getCommonCanvasAncestor(selection);
  if (commonCanvas && commonCanvas.absoluteBoundingBox) {
    return {
      mode: "common-parent-canvas",
      canvasNode: commonCanvas,
      canvasBounds: commonCanvas.absoluteBoundingBox,
      assetNodes: getImportableAssetNodes(selection),
      selection,
    };
  }

  return {
    mode: "selection-bounds",
    canvasNode: null,
    canvasBounds: getSelectionBounds(selection),
    assetNodes: getImportableAssetNodes(selection),
    selection,
  };
};

const bytesToBase64 = (bytes) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triple = (a << 16) | (b << 8) | c;
    output += alphabet[(triple >> 18) & 63];
    output += alphabet[(triple >> 12) & 63];
    output += i + 1 < bytes.length ? alphabet[(triple >> 6) & 63] : "=";
    output += i + 2 < bytes.length ? alphabet[triple & 63] : "=";
  }
  return output;
};

const postToUi = (message) => {
  figma.ui.postMessage(message);
};

const addNodeAndAncestorsToSet = (node, ids) => {
  let current = node || null;
  while (current && current.type !== "DOCUMENT") {
    if (current.id) ids.add(current.id);
    current = current.parent || null;
  }
};

const addNodeIdAndAncestorsToSet = async (nodeId, ids) => {
  if (!nodeId) return;
  ids.add(nodeId);
  const node = await getNodeByIdSafe(nodeId);
  addNodeAndAncestorsToSet(node, ids);
};

const getNodeByIdSafe = async (nodeId) => {
  if (!nodeId) return null;
  if (typeof figma.getNodeByIdAsync === "function") {
    return await figma.getNodeByIdAsync(nodeId);
  }
  return figma.getNodeById(nodeId);
};

const makeBox = (box) =>
  box
    ? {
        x: round(box.x),
        y: round(box.y),
        width: round(box.width),
        height: round(box.height),
      }
    : null;

const readPngSize = (bytes) => {
  if (!bytes || bytes.length < 24) return null;
  if (
    bytes[0] !== 137 ||
    bytes[1] !== 80 ||
    bytes[2] !== 78 ||
    bytes[3] !== 71 ||
    bytes[4] !== 13 ||
    bytes[5] !== 10 ||
    bytes[6] !== 26 ||
    bytes[7] !== 10
  ) {
    return null;
  }
  const width =
    bytes[16] * 16777216 + bytes[17] * 65536 + bytes[18] * 256 + bytes[19];
  const height =
    bytes[20] * 16777216 + bytes[21] * 65536 + bytes[22] * 256 + bytes[23];
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
};

const makeNodeSnapshot = (node, canvasBounds) => {
  const box = node && node.absoluteBoundingBox ? node.absoluteBoundingBox : null;
  if (!nodeCanExport(node) || !box || !canvasBounds) return null;
  const absolute = makeBox(box);
  const relative = {
    x: round(box.x - canvasBounds.x),
    y: round(box.y - canvasBounds.y),
    width: round(box.width),
    height: round(box.height),
  };
  const signature = [
    node.id,
    node.name || "",
    node.type || "",
    node.visible === false ? "hidden" : "visible",
    relative.x,
    relative.y,
    relative.width,
    relative.height,
  ].join("|");

  return {
    absolute,
    relative,
    signature,
  };
};

const getProjectCanvasBounds = async (project, fallbackAssets = []) => {
  const metadata = project && project.metadata ? project.metadata : {};
  const canvasId = metadata.sourceCanvasId;
  if (canvasId) {
    const canvasNode = await getNodeByIdSafe(canvasId);
    if (canvasNode && canvasNode.absoluteBoundingBox) {
      return canvasNode.absoluteBoundingBox;
    }
  }

  const trackedNodes = [];
  for (const asset of fallbackAssets) {
    const source = asset && asset.source ? asset.source : {};
    const node = await getNodeByIdSafe(source.figmaNodeId);
    if (nodeCanExport(node)) trackedNodes.push(node);
  }

  return (
    getSelectionBounds(trackedNodes) ||
    metadata.sourceCanvasAbsoluteBoundingBox ||
    null
  );
};

const makeProjectAssetFromNode = async ({
  node,
  canvasNode,
  canvasBounds,
  index,
  key,
  animation,
  exportScale,
  importMode,
}) => {
  const box = node.absoluteBoundingBox;
  const snapshot = makeNodeSnapshot(node, canvasBounds);
  if (!box || !snapshot) return null;
  const assetKey = key || sanitizeKey(node.name, `layer_${index + 1}`);
  const bytes = await node.exportAsync({
    format: "PNG",
    constraint: { type: "SCALE", value: exportScale },
    useAbsoluteBounds: true,
  });
  const pngSize = readPngSize(bytes);
  const base64 = bytesToBase64(bytes);
  const file = `assets/${assetKey}.png`;

  return {
    projectAsset: {
      key: assetKey,
      label: node.name || `Layer ${index + 1}`,
      type: "image",
      role: "figma_layer",
      file,
      visible: true,
      fit: "none",
      transform: {
        x: snapshot.relative.x,
        y: snapshot.relative.y,
        scale: 1,
        rotate: 0,
      },
      animation: animation || {
        type: "none",
        speed: 1,
        intensity: 1,
      },
      source: {
        figmaNodeId: node.id,
        figmaNodeType: node.type,
        figmaAssetKind: inferFigmaAssetKind(node),
        figmaNodeName: node.name || "",
        figmaCanvasId: canvasNode && canvasNode.id ? canvasNode.id : null,
        figmaCanvasName: canvasNode && canvasNode.name ? canvasNode.name : null,
        importMode,
        absoluteBoundingBox: snapshot.absolute,
        canvasRelativeBoundingBox: snapshot.relative,
        rasterizedVisualTransform: true,
        signature: snapshot.signature,
        exportScale,
      },
    },
    assetPayload: {
      key: assetKey,
      file,
      mimeType: "image/png",
      width: pngSize ? pngSize.width : Math.max(1, Math.round(snapshot.relative.width * exportScale)),
      height: pngSize ? pngSize.height : Math.max(1, Math.round(snapshot.relative.height * exportScale)),
      dataUrl: `data:image/png;base64,${base64}`,
    },
  };
};

const makeInstallationId = () =>
  `figma-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const readLicenseStorage = async () => {
  if (licenseStorageMode === "memory") {
    return fallbackLicenseStorage || {};
  }
  try {
    return (await figma.clientStorage.getAsync(LICENSE_STORAGE_KEY)) || {};
  } catch (_error) {
    licenseStorageMode = "memory";
    return fallbackLicenseStorage || {};
  }
};

const writeLicenseStorage = async (state) => {
  if (licenseStorageMode === "memory") {
    fallbackLicenseStorage = state;
    return;
  }
  try {
    await figma.clientStorage.setAsync(LICENSE_STORAGE_KEY, state);
  } catch (_error) {
    licenseStorageMode = "memory";
    fallbackLicenseStorage = state;
  }
};

const getStoredLicenseState = async () => {
  const stored = await readLicenseStorage();
  const installationId =
    typeof stored.installationId === "string" && stored.installationId
      ? stored.installationId
      : makeInstallationId();
  const nextState = {
    installationId,
    freeExportsUsed: Math.max(0, Math.round(Number(stored.freeExportsUsed || 0))),
    license: stored.license && typeof stored.license === "object" ? stored.license : null,
    activatedExportsUsed: Math.max(0, Math.round(Number(stored.activatedExportsUsed || 0))),
  };

  if (nextState.installationId !== stored.installationId) {
    await writeLicenseStorage(nextState);
  }
  return nextState;
};

const saveStoredLicenseState = async (state) => {
  await writeLicenseStorage(state);
};

const licenseHasExportLimit = (license) =>
  license &&
  license.maxExports !== null &&
  typeof license.maxExports !== "undefined" &&
  license.maxExports !== "" &&
  Number.isFinite(Number(license.maxExports)) &&
  Number(license.maxExports) >= 0;

const isLicenseActive = (state) => {
  const license = state && state.license ? state.license : null;
  if (!license || license.product !== LICENSE_PRODUCT_ID) return false;
  if (license.installationId && license.installationId !== state.installationId) return false;
  if (license.expiresAt) {
    const expiresAt = Date.parse(license.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;
  }
  if (
    licenseHasExportLimit(license) &&
    state.activatedExportsUsed >= Number(license.maxExports)
  ) {
    return false;
  }
  return true;
};

const makeLicenseUiState = (state) => {
  const active = isLicenseActive(state);
  const freeExportsUsed = Math.min(FREE_EXPORT_LIMIT, Math.max(0, state.freeExportsUsed || 0));
  return {
    product: LICENSE_PRODUCT_ID,
    installationId: state.installationId,
    freeExportLimit: FREE_EXPORT_LIMIT,
    freeExportsUsed,
    freeExportsRemaining: Math.max(0, FREE_EXPORT_LIMIT - freeExportsUsed),
    activated: active,
    storageMode: licenseStorageMode,
    license: state.license
      ? {
          licenseId: state.license.licenseId || "",
          customer: state.license.customer || "",
          plan: state.license.plan || "",
          expiresAt: state.license.expiresAt || null,
          installationId: state.license.installationId || null,
          maxExports:
            typeof state.license.maxExports === "undefined"
              ? null
              : state.license.maxExports,
        }
      : null,
    activatedExportsUsed: state.activatedExportsUsed || 0,
  };
};

const postLicenseState = async (requestId) => {
  const state = await getStoredLicenseState();
  postToUi({
    type: "license-state",
    requestId,
    payload: makeLicenseUiState(state),
  });
};

const saveLicensePayload = async (payload, requestId) => {
  const state = await getStoredLicenseState();
  const license = payload && payload.license ? payload.license : null;
  if (!license || license.product !== LICENSE_PRODUCT_ID) {
    throw new Error("授权码不适用于当前插件。");
  }
  if (license.installationId && license.installationId !== state.installationId) {
    throw new Error("授权码与当前插件识别码不匹配。");
  }
  if (license.expiresAt) {
    const expiresAt = Date.parse(license.expiresAt);
    if (!Number.isFinite(expiresAt)) {
      throw new Error("授权码过期时间无效。");
    }
    if (expiresAt <= Date.now()) {
      throw new Error("授权码已过期。");
    }
  }
  const nextLicense = Object.assign({}, license, {
    activatedAt: new Date().toISOString(),
  });
  const nextState = Object.assign({}, state, {
    license: nextLicense,
  });
  await saveStoredLicenseState(nextState);
  postToUi({
    type: "license-activation-response",
    requestId,
    allowed: true,
    payload: makeLicenseUiState(nextState),
  });
};

const requestExportAccess = async (requestId) => {
  const state = await getStoredLicenseState();
  if (isLicenseActive(state)) {
    const license = state.license || {};
    const nextState =
      licenseHasExportLimit(license)
        ? Object.assign({}, state, {
            activatedExportsUsed: (state.activatedExportsUsed || 0) + 1,
          })
        : state;
    if (nextState !== state) await saveStoredLicenseState(nextState);
    postToUi({
      type: "license-export-response",
      requestId,
      allowed: true,
      reason: "activated",
      payload: makeLicenseUiState(nextState),
    });
    return;
  }

  if ((state.freeExportsUsed || 0) < FREE_EXPORT_LIMIT) {
    const nextState = Object.assign({}, state, {
      freeExportsUsed: (state.freeExportsUsed || 0) + 1,
    });
    await saveStoredLicenseState(nextState);
    postToUi({
      type: "license-export-response",
      requestId,
      allowed: true,
      reason: "free",
      payload: makeLicenseUiState(nextState),
    });
    return;
  }

  postToUi({
    type: "license-export-response",
    requestId,
    allowed: false,
    reason: "free-limit-exhausted",
    payload: makeLicenseUiState(state),
  });
};

const makeSelectionSummary = () => {
  const plan = createImportPlan();
  const bounds = plan.canvasBounds;
  const nodes = plan.assetNodes;
  return {
    count: nodes.length,
    mode: plan.mode,
    canvasName: plan.canvasNode && plan.canvasNode.name ? plan.canvasNode.name : null,
    selectionCount: plan.selection.length,
    bounds: bounds
      ? {
          x: round(bounds.x),
          y: round(bounds.y),
          width: round(bounds.width),
          height: round(bounds.height),
        }
      : null,
    layers: nodes.map((node, index) => {
      const box = node.absoluteBoundingBox;
      const snapshot = box ? makeNodeSnapshot(node, bounds) : null;
      const relative = snapshot ? snapshot.relative : null;
      return {
        id: node.id,
        name: node.name || `Layer ${index + 1}`,
        type: node.type,
        kind: inferFigmaAssetKind(node),
        width: relative ? relative.width : box ? round(box.width) : 0,
        height: relative ? relative.height : box ? round(box.height) : 0,
      };
    }),
  };
};

const buildMaterialProject = async (options = {}) => {
  const plan = createImportPlan();
  if (plan.selection.length === 0) {
    throw new Error("请先在 Figma 画布中选择至少一个可导出的图层。");
  }

  const bounds = plan.canvasBounds;
  if (!bounds) {
    throw new Error("无法读取 Figma 画布尺寸。");
  }

  const nodes = plan.assetNodes;
  if (nodes.length === 0) {
    throw new Error("当前 Figma 画布中没有可导出的可见图层。");
  }

  const exportScale = Math.max(0.25, Math.min(4, Number(options.exportScale || DEFAULT_EXPORT_SCALE)));
  const fps = Math.max(1, Math.min(60, Math.round(Number(options.fps || 24))));
  const frames = Math.max(1, Math.min(600, Math.round(Number(options.frames || 72))));
  const materialType = String(options.materialType || "figma_selection").trim() || "figma_selection";
  const defaultAnimation = options.defaultAnimation || {
    type: "none",
    speed: 1,
    intensity: 1,
  };
  const createdAt = new Date().toISOString();

  const projectAssets = [];
  const assetPayloads = [];
  const usedKeys = new Set();

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const baseKey = sanitizeKey(node.name, `layer_${index + 1}`);
    let key = baseKey;
    let suffix = 2;
    while (usedKeys.has(key)) {
      key = `${baseKey}_${suffix}`;
      suffix += 1;
    }
    usedKeys.add(key);

    const layer = await makeProjectAssetFromNode({
      node,
      canvasNode: plan.canvasNode,
      canvasBounds: bounds,
      index,
      key,
      animation: {
        type: defaultAnimation.type || "none",
        speed: Number(defaultAnimation.speed || 1),
        intensity: Number(defaultAnimation.intensity || 1),
      },
      exportScale,
      importMode: plan.mode,
    });
    if (!layer) continue;
    projectAssets.push(layer.projectAsset);
    assetPayloads.push(layer.assetPayload);
  }

  return {
    project: {
      schemaVersion: "svga-vap-lab-project/v1",
      createdBy: "figma-plugin:svga-editor",
      materialType,
      prompt: "Imported from selected Figma canvas layers.",
      canvas: {
        width: Math.max(1, Math.round(bounds.width)),
        height: Math.max(1, Math.round(bounds.height)),
      },
      generation: {
        provider: "figma",
        source: "figma-selection",
        noProceduralFallback: false,
      },
      exportRules: { fps, frames },
      layoutRules: {
        preserveCanvasPlacement: true,
        normalizeReferenceVisualBounds: false,
      },
      assets: projectAssets,
      effects: [],
      metadata: {
        sourceFileName: figma.root.name,
        sourcePageName: figma.currentPage.name,
        sourceCanvasId: plan.canvasNode && plan.canvasNode.id ? plan.canvasNode.id : null,
        sourceCanvasName: plan.canvasNode && plan.canvasNode.name ? plan.canvasNode.name : null,
        sourceCanvasAbsoluteBoundingBox: makeBox(bounds),
        sourceImportMode: plan.mode,
        sourceSelectionCount: plan.selection.length,
        importedLayerCount: nodes.length,
        createdAt,
      },
    },
    assets: assetPayloads,
    summary: {
      canvas: {
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
      },
      layerCount: projectAssets.length,
      canvasName: plan.canvasNode && plan.canvasNode.name ? plan.canvasNode.name : null,
      importMode: plan.mode,
      createdAt,
    },
  };
};

const shouldRunFullCaptureForSelection = (selection, project) => {
  if (selection.length !== 1) return false;
  const selected = selection[0];
  if (!nodeCanBeCanvas(selected) || !nodeHasChildren(selected)) return false;
  const sourceCanvasId = project && project.metadata ? project.metadata.sourceCanvasId : null;
  return !sourceCanvasId || selected.id === sourceCanvasId;
};

const uniqueAssetKey = (baseKey, usedKeys) => {
  let key = baseKey;
  let suffix = 2;
  while (usedKeys.has(key)) {
    key = `${baseKey}_${suffix}`;
    suffix += 1;
  }
  usedKeys.add(key);
  return key;
};

const syncSelectedProjectLayers = async (message) => {
  const project = message.project;
  const options = message.options || {};
  if (!project || !Array.isArray(project.assets)) {
    return {
      mode: "full",
      package: await buildMaterialProject(options),
    };
  }

  const selection = getExportableSelection();
  if (selection.length === 0) {
    throw new Error("请先在 Figma 中选择要同步的画布或图层。");
  }

  if (shouldRunFullCaptureForSelection(selection, project)) {
    return {
      mode: "full",
      package: await buildMaterialProject(options),
    };
  }

  const projectMetadata = project.metadata || {};
  const canvasNode = projectMetadata.sourceCanvasId
    ? await getNodeByIdSafe(projectMetadata.sourceCanvasId)
    : null;
  const canvasBounds = await getProjectCanvasBounds(project, project.assets);
  if (!canvasBounds) throw new Error("无法读取原 Figma 画布尺寸。");

  const exportScale = Math.max(0.25, Math.min(4, Number(options.exportScale || DEFAULT_EXPORT_SCALE)));
  const usedKeys = new Set(project.assets.map((asset) => asset.key).filter(Boolean));
  const existingByNodeId = new Map();
  for (const asset of project.assets) {
    const nodeId = asset && asset.source ? asset.source.figmaNodeId : null;
    if (nodeId) existingByNodeId.set(nodeId, asset);
  }

  const layers = [];
  for (let index = 0; index < selection.length; index += 1) {
    const node = selection[index];
    if (!nodeCanExport(node)) continue;
    const existingAsset = existingByNodeId.get(node.id);
    const key = existingAsset
      ? existingAsset.key
      : uniqueAssetKey(sanitizeKey(node.name, `layer_${project.assets.length + index + 1}`), usedKeys);
    const layer = await makeProjectAssetFromNode({
      node,
      canvasNode: canvasNode && canvasNode.absoluteBoundingBox ? canvasNode : null,
      canvasBounds,
      index,
      key,
      animation: existingAsset && existingAsset.animation ? existingAsset.animation : {
        type: "none",
        speed: 1,
        intensity: 1,
      },
      exportScale,
      importMode:
        existingAsset && existingAsset.source && existingAsset.source.importMode
          ? existingAsset.source.importMode
          : projectMetadata.sourceImportMode || "selected-layer-sync",
    });
    if (!layer) continue;
    layers.push({
      nodeId: node.id,
      previousKey: existingAsset ? existingAsset.key : null,
      isNew: !existingAsset,
      asset: layer.projectAsset,
      payload: layer.assetPayload,
    });
  }

  if (layers.length === 0) {
    throw new Error("当前选择中没有可同步的图层。");
  }

  const canvasLayerOrderNodeIds =
    canvasNode && nodeHasChildren(canvasNode)
      ? getExportableChildren(canvasNode).map((node) => node.id)
      : [];

  return {
    mode: "partial",
    canvas: {
      width: Math.max(1, Math.round(canvasBounds.width)),
      height: Math.max(1, Math.round(canvasBounds.height)),
      absoluteBoundingBox: makeBox(canvasBounds),
      sourceCanvasName:
        canvasNode && canvasNode.name
          ? canvasNode.name
          : projectMetadata.sourceCanvasName || null,
    },
    canvasLayerOrderNodeIds,
    layers,
  };
};

const checkLayerUpdates = async (project) => {
  const assets = project && Array.isArray(project.assets) ? project.assets : [];
  const canvasBounds = await getProjectCanvasBounds(project, assets);
  const projectCanvas = project && project.canvas ? project.canvas : {};
  const canvasWidth = canvasBounds ? Math.max(1, Math.round(canvasBounds.width)) : projectCanvas.width;
  const canvasHeight = canvasBounds ? Math.max(1, Math.round(canvasBounds.height)) : projectCanvas.height;
  const canvasChanged =
    Boolean(canvasBounds) &&
    (Math.round(Number(projectCanvas.width || 0)) !== canvasWidth ||
      Math.round(Number(projectCanvas.height || 0)) !== canvasHeight);

  const layers = [];
  for (const asset of assets) {
    const source = asset && asset.source ? asset.source : {};
    if (!source.figmaNodeId) continue;
    const node = await getNodeByIdSafe(source.figmaNodeId);
    if (!nodeCanExport(node) || !canvasBounds) {
      layers.push({
        key: asset.key,
        status: "missing",
        changed: true,
        message: "Figma 图层不存在或不可导出",
      });
      continue;
    }
    const snapshot = makeNodeSnapshot(node, canvasBounds);
    const changed = (snapshot ? snapshot.signature : null) !== source.signature;
    layers.push({
      key: asset.key,
      figmaNodeId: node.id,
      name: node.name || asset.label || asset.key,
      status: changed ? "changed" : "current",
      changed,
      snapshot,
    });
  }

  return {
    canvas: {
      width: canvasWidth,
      height: canvasHeight,
      changed: canvasChanged,
    },
    layers,
  };
};

const updateProjectLayer = async (message) => {
  const project = message.project;
  const asset = message.asset;
  const exportScale = message.exportScale;
  if (!project || !asset) throw new Error("缺少要更新的图层。");
  const assetSource = asset && asset.source ? asset.source : {};
  const projectMetadata = project && project.metadata ? project.metadata : {};
  const node = await getNodeByIdSafe(assetSource.figmaNodeId);
  if (!nodeCanExport(node)) {
    throw new Error("Figma 图层不存在或不可导出。");
  }

  const canvasId = assetSource.figmaCanvasId || projectMetadata.sourceCanvasId;
  const canvasNode = canvasId ? await getNodeByIdSafe(canvasId) : null;
  const canvasBounds = await getProjectCanvasBounds(project, [asset]);
  if (!canvasBounds) throw new Error("无法读取 Figma 画布尺寸。");

  const nextExportScale = Math.max(
    0.25,
    Math.min(4, Number(exportScale || assetSource.exportScale || DEFAULT_EXPORT_SCALE)),
  );
  const layer = await makeProjectAssetFromNode({
    node,
    canvasNode: canvasNode && canvasNode.absoluteBoundingBox ? canvasNode : null,
    canvasBounds,
    index: 0,
    key: asset.key,
    animation: asset.animation || {
      type: "none",
      speed: 1,
      intensity: 1,
    },
    exportScale: nextExportScale,
    importMode: assetSource.importMode || projectMetadata.sourceImportMode || "updated-layer",
  });
  if (!layer) throw new Error("图层导出失败。");

  return {
    canvas: {
      width: Math.max(1, Math.round(canvasBounds.width)),
      height: Math.max(1, Math.round(canvasBounds.height)),
      absoluteBoundingBox: makeBox(canvasBounds),
      sourceCanvasName:
        canvasNode && canvasNode.name
          ? canvasNode.name
          : projectMetadata.sourceCanvasName || null,
    },
    asset: layer.projectAsset,
    payload: layer.assetPayload,
  };
};

figma.ui.onmessage = async (message) => {
  try {
    if (message.type === "license-get-state") {
      await postLicenseState(message.requestId);
      return;
    }

    if (message.type === "license-save") {
      await saveLicensePayload(message, message.requestId);
      return;
    }

    if (message.type === "license-request-export") {
      await requestExportAccess(message.requestId);
      return;
    }

    if (message.type === "scan-selection") {
      postToUi({ type: "selection-summary", payload: makeSelectionSummary() });
      return;
    }

    if (message.type === "capture-selection") {
      postToUi({ type: "capture-started" });
      const payload = await buildMaterialProject(message.options || {});
      postToUi({ type: "capture-complete", payload });
      figma.notify(`已导入 ${payload.summary.layerCount} 个 Figma 图层`);
      return;
    }

    if (message.type === "sync-selected-layers") {
      postToUi({
        type: "sync-selected-layers-response",
        requestId: message.requestId,
        payload: await syncSelectedProjectLayers(message),
      });
      return;
    }

    if (message.type === "check-layer-updates") {
      postToUi({
        type: "layer-update-status",
        requestId: message.requestId,
        payload: await checkLayerUpdates(message.project),
      });
      return;
    }

    if (message.type === "update-layer") {
      postToUi({
        type: "layer-update-response",
        requestId: message.requestId,
        payload: await updateProjectLayer(message),
      });
      return;
    }

    if (message.type === "notify") {
      figma.notify(String(message.message || ""));
      return;
    }

    if (message.type === "resize") {
      const width = Math.max(UI_MIN_SIZE.width, Math.min(UI_MAX_SIZE.width, Math.round(Number(message.width || UI_SIZE.width))));
      const height = Math.max(UI_MIN_SIZE.height, Math.min(UI_MAX_SIZE.height, Math.round(Number(message.height || UI_SIZE.height))));
      if (message.position === "minimized-bottom" && canRepositionUi()) {
        const currentPosition = getUiCanvasPosition();
        if (currentPosition && message.rememberPosition !== false) {
          restoreUiCanvasPosition = currentPosition;
        }
      }
      figma.ui.resize(width, height);
      if (message.position === "minimized-bottom" && canRepositionUi()) {
        const position = minimizedUiCanvasPosition(width, height);
        figma.ui.reposition(position.x, position.y);
      }
      if (message.position === "restore" && restoreUiCanvasPosition && canRepositionUi()) {
        figma.ui.reposition(restoreUiCanvasPosition.x, restoreUiCanvasPosition.y);
        restoreUiCanvasPosition = null;
      }
    }
  } catch (error) {
    postToUi({
      type:
        message.type === "license-save"
          ? "license-activation-response"
          : "plugin-error",
      requestId: message.requestId,
      allowed: false,
      message: error instanceof Error ? error.message : String(error),
    });
    figma.notify(error instanceof Error ? error.message : String(error), {
      error: true,
    });
  }
};

figma.on("selectionchange", () => {
  postToUi({ type: "selection-summary", payload: makeSelectionSummary() });
});

try {
  figma.on("documentchange", async (event) => {
    const nodeIds = new Set();
    const documentChanges = event && Array.isArray(event.documentChanges) ? event.documentChanges : [];
    for (const change of documentChanges) {
      addNodeAndAncestorsToSet(change.node, nodeIds);
      addNodeAndAncestorsToSet(change.parent, nodeIds);
      await addNodeIdAndAncestorsToSet(
        change.id ||
          (change.node && change.node.id ? change.node.id : null) ||
          (change.parent && change.parent.id ? change.parent.id : null),
        nodeIds,
      );
    }
    if (nodeIds.size > 0) {
      postToUi({
        type: "figma-document-changed",
        nodeIds: Array.from(nodeIds),
      });
    }
  });
} catch (_error) {
  // Older Figma plugin runtimes may not expose documentchange. Polling still handles geometry/name changes.
}

postToUi({ type: "selection-summary", payload: makeSelectionSummary() });
