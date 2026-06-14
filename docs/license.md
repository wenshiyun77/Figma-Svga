# 离线授权码

这个插件使用无后端授权模式。

## 插件侧逻辑

- 使用 `figma.clientStorage` 记录本机免费导出次数。
- 每个插件安装环境免费导出 10 次。
- 免费次数用完后，需要激活有效授权码才能继续导出。
- 授权弹窗展示联系二维码和本机 `授权识别码`。
- 插件内置 ECDSA P-256 公钥，本地验签授权码，不请求后端。

## 为什么不需要后端

插件只内置公钥。私钥只保存在你本地。有效授权码是一段签名后的 JSON：

```text
SVGA1.<base64url payload>.<base64url signature>
```

插件用公钥验证这段授权码确实由你的私钥签发，因此不需要服务器。

## 注意

无后端授权无法做到绝对防破解。它适合正常用户分发和轻量授权，不适合高强度防篡改场景。

## 初始化密钥

生成私钥，并把对应公钥写入 `src/ui.html`：

```bash
npm run license:keygen
```

This creates:

```text
license-private-key.pem
```

这个文件必须保密，已经被 `.gitignore` 忽略。

## 生成授权码

让用户发送插件里的 `授权识别码`，然后按月数生成授权码。默认 1 个月：

```bash
npm run license:code -- --customer "客户名" --installation-id "figma-xxxx"
```

指定 3 个月：

```bash
npm run license:code -- --customer "客户名" --installation-id "figma-xxxx" --months 3
```

把输出的 `SVGA1...` 发给用户。

## 验证授权码

生成后建议用当前插件公钥验签一次：

```bash
npm run license:verify -- --code "SVGA1..." --installation-id "figma-xxxx"
```

验签通过会输出授权 ID、识别码和准确过期时间。

## 通用授权码

如果需要不绑定单个识别码：

```bash
npm run license:code -- --customer "客户名" --all-devices --months 1
```

通用码更容易分发，也更容易被转发。
