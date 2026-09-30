import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../releases/20260930-v15/app.mjs', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../releases/20260930-v15/styles.css', import.meta.url), 'utf8');
const sourceBetween = (start, end) => app.slice(app.indexOf(start), app.indexOf(end));

test('active trial and permanent controls open cancellation; monthly keeps extension dialog', () => {
  const dialog = { hidden: true };
  const context = {
    proDialogState: null,
    proDialogMonths: 3,
    renderProSubscriptionDialog() {},
    $: (id) => id === '#proSubscriptionDialog' ? dialog : { focus() {} },
    requestAnimationFrame(callback) { callback(); },
  };
  const open = vm.runInNewContext(`${sourceBetween('function openProSubscriptionDialog(', 'function closeProSubscriptionDialog(')}; openProSubscriptionDialog`, context);
  const card = {};
  for (const plan of ['trial', 'permanent', 'monthly']) {
    open({ dataset: { id: 'user-1', plan, on: '1' }, closest: () => card });
    assert.equal(context.proDialogState.plan, plan === 'monthly' ? 'monthly' : 'cancel');
    assert.equal(dialog.hidden, false);
  }
  open({ dataset: { id: 'user-1', plan: 'trial', on: '0' }, closest: () => card });
  assert.equal(context.proDialogState.plan, 'trial');
});

test('confirmed cancellation sends the supported none plan to the admin API', async () => {
  let payload;
  const confirmButton = { disabled: false, textContent: '' };
  const context = {
    proDialogState: { figmaUserId: 'user-1', plan: 'cancel', card: {} },
    proDialogMonths: 1,
    $: () => confirmButton,
    async request(action, body) { assert.equal(action, 'admin-user-feature'); payload = body; return { subscription: { plan: 'none' } }; },
    applySubscriptionToCard() {},
    closeProSubscriptionDialog() {},
    toast() {},
    loadUsers() {},
    renderProSubscriptionDialog() {},
  };
  const submit = vm.runInNewContext(`${sourceBetween('async function submitProSubscription(', 'async function usersPage(')}; submitProSubscription`, context);
  await submit();
  assert.equal(payload.plan, 'none');
  assert.equal(payload.confirmCancel, true);
  assert.equal(confirmButton.disabled, false);
});

test('three PRO controls fit one row and monthly cancellation stays in its dialog', () => {
  const card = sourceBetween('function userCard(', 'function applyProButtonState(');
  assert.equal((card.match(/class="btn secondary proBtn /g) || []).length, 3);
  assert.doesNotMatch(card, /proCancelBtn/);
  assert.match(css, /\.proButtons\{display:grid;grid-template-columns:repeat\(3,max-content\)/);
  assert.match(app, /id="proSubscriptionCancel" type="button" hidden>取消 PRO/);
  assert.match(app, /cancelBtn\.hidden=!\(plan==='monthly'&&active\)/);
  assert.match(app, /proDialogState\.plan='cancel';renderProSubscriptionDialog\(\)/);
});
