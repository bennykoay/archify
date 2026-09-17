import * as validators from './generated-validators.mjs';
import { throwDiagnosticError } from './diagnostics.mjs';

// "/nodes/3/label" reads much better as "/nodes/3 (id: "router") /label" for the
// LLM fixing the JSON; resolve the nearest enclosing element's id or label.
function annotatedPath(instancePath, data) {
  if (!instancePath) return { path: '/', identity: null };
  let node = data;
  let hint = null;
  for (const seg of instancePath.split('/').slice(1)) {
    if (node == null || typeof node !== 'object') break;
    node = node[/^\d+$/.test(seg) ? Number(seg) : seg];
    if (node && typeof node === 'object' && !Array.isArray(node)) {
      const tag = node.id ?? node.label;
      if (tag != null) hint = String(tag);
    }
  }
  return { path: instancePath, identity: hint };
}

function annotatePath(instancePath, data) {
  const annotated = annotatedPath(instancePath, data);
  return annotated.identity != null
    ? `${annotated.path} (id/label: ${JSON.stringify(annotated.identity)})`
    : annotated.path;
}

function formatErrors(errors, data) {
  return errors.map((e) => {
    const where = annotatePath(e.instancePath, data);
    const detail = e.params && Object.keys(e.params).length
      ? ' ' + JSON.stringify(e.params)
      : '';
    return `  ${where} ${e.message}${detail}`;
  }).join('\n');
}

// OSM-SYS-003 Obj2: authored geometry is banned — coordinates (pos) plus the
// five bypass channels (via, channelX, channelY, labelAt, route) — across
// architecture/workflow/dataflow/lifecycle. This pre-check throws a CLEAR
// error naming the key (never a silent ignore); the JSON Schemas also drop
// these properties so AJV rejects them as a backstop.
const BANNED_GEOMETRY = Object.freeze([
  { types: ['architecture'], collection: 'components', keys: ['pos'] },
  { types: ['architecture'], collection: 'connections', keys: ['via', 'channelX', 'channelY', 'labelAt', 'route'] },
  { types: ['workflow'], collection: 'edges', keys: ['via', 'channelX', 'channelY', 'labelAt', 'route'] },
  { types: ['dataflow'], collection: 'flows', keys: ['via', 'channelX', 'channelY', 'labelAt', 'route'] },
  { types: ['lifecycle'], collection: 'transitions', keys: ['via', 'channelX', 'channelY', 'labelAt', 'route'] },
]);

export function assertNoAuthoredGeometry(diagramType, data) {
  const problems = [];
  for (const rule of BANNED_GEOMETRY) {
    if (!rule.types.includes(diagramType)) continue;
    const items = Array.isArray(data?.[rule.collection]) ? data[rule.collection] : [];
    items.forEach((item, index) => {
      for (const key of rule.keys) {
        if (item != null && item[key] !== undefined) {
          const tag = item.id != null ? ` (id: ${JSON.stringify(String(item.id))})` : '';
          problems.push({
            code: 'schema/authored-geometry',
            severity: 'error',
            message: `Authored geometry is banned (SYS-003): ${diagramType} ${rule.collection}[${index}]${tag} uses "${key}" — remove it; the layout engine owns all geometry.`,
            subject: { diagramType, path: `/${rule.collection}/${index}`, ...(item.id != null ? { identity: String(item.id) } : {}) },
            evidence: { bannedKey: key },
            supportedFixes: [`remove "${key}" from ${rule.collection}[${index}]${tag} and re-render; the layout engine computes it`],
          });
        }
      }
    });
  }
  if (problems.length) {
    const lines = problems.map((p) => `  ${p.message}`).join('\n');
    throwDiagnosticError(`Authored geometry is banned (SYS-003):\n${lines}`, problems);
  }
}

export function validateSchema(diagramType, data) {
  const validate = validators[diagramType];
  if (!validate) {
    throw new Error(`validateSchema: unknown diagram type "${diagramType}"`);
  }
  assertNoAuthoredGeometry(diagramType, data);
  if (!validate(data)) {
    const diagnostics = validate.errors.map((error) => {
      const annotated = annotatedPath(error.instancePath, data);
      const subject = {
        diagramType,
        path: annotated.path,
        ...(annotated.identity != null ? { identity: String(annotated.identity) } : {}),
      };
      const evidence = {
        keyword: error.keyword,
        expected: error.schema,
        ...error.params,
      };
      const supportedFixes = {
        additionalProperties: [`remove unsupported property ${JSON.stringify(error.params?.additionalProperty)}`],
        required: [`add required property ${JSON.stringify(error.params?.missingProperty)}`],
        type: [`use ${JSON.stringify(error.params?.type)} at ${annotated.path}`],
        enum: [`choose one of ${JSON.stringify(error.params?.allowedValues || [])}`],
        pattern: [`match the required pattern ${JSON.stringify(error.params?.pattern)}`],
        minimum: [`use a value ${error.params?.comparison || '>='} ${error.params?.limit}`],
        maximum: [`use a value ${error.params?.comparison || '<='} ${error.params?.limit}`],
        minItems: [`provide at least ${error.params?.limit} item(s)`],
        maxItems: [`provide at most ${error.params?.limit} item(s)`],
        minLength: [`provide at least ${error.params?.limit} character(s)`],
        maxLength: [`provide at most ${error.params?.limit} character(s)`],
      }[error.keyword] || [];
      const detail = error.params && Object.keys(error.params).length
        ? ` ${JSON.stringify(error.params)}`
        : '';
      return {
        code: `schema/${error.keyword}`,
        severity: 'error',
        message: `${annotatePath(error.instancePath, data)} ${error.message}${detail}`,
        subject,
        evidence,
        supportedFixes,
      };
    });
    throwDiagnosticError(
      `${diagramType} schema validation failed:\n${formatErrors(validate.errors, data)}`,
      diagnostics,
    );
  }
}
