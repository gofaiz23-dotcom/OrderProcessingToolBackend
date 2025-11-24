import { buildGoogleAuthUrl, exchangeCodeForTokens } from '../services/googleAuthService.js';
import { saveRefreshToken } from '../services/googleAuthTokenService.js';

const buildSuccessHtml = () => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Google Authorization Successful</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f5f6fa; padding: 40px; }
      .card { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); text-align: center; }
      h1 { margin-bottom: 12px; }
      p { color: #4a4a4a; line-height: 1.6; }
      .cta { margin-top: 24px; display: inline-block; padding: 12px 20px; border-radius: 8px; background: #0061ff; color: #fff; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Authorization Successful</h1>
      <p>Your refresh token has been securely stored in the database.</p>
      <p><strong>Reminder:</strong> Google may expire this token after 5 days of inactivity. If email calls start failing, revisit this page to refresh the connection.</p>
      <p>You can now use inbox, sent, and compose email features without any additional setup.</p>
      <button class="cta" id="closeBtn">Close window</button>
      <p id="closeHint" style="margin-top: 12px; font-size: 13px; color: #888;"></p>
    </div>
    <script>
      const btn = document.getElementById('closeBtn');
      const hint = document.getElementById('closeHint');
      btn.addEventListener('click', () => {
        window.close();
        setTimeout(() => {
          if (!window.closed) {
            window.open('', '_self');
            window.close();
          }
          if (!window.closed) {
            hint.textContent = 'If this tab stays open, please close it manually.';
          }
        }, 200);
      });
    </script>
  </body>
</html>`;

export const renderGoogleAuthStart = (req, res) => {
  res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Connect Gmail</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f5f6fa; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
      .panel { background: #fff; padding: 32px 40px; border-radius: 12px; box-shadow: 0 12px 30px rgba(0,0,0,0.08); max-width: 480px; text-align: center; }
      button { padding: 12px 20px; background: #0061ff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; }
      button:disabled { opacity: 0.6; cursor: not-allowed; }
      .status { margin-top: 16px; font-size: 14px; color: #4a4a4a; min-height: 20px; }
    </style>
  </head>
  <body>
    <div class="panel">
      <h2>Authorize Gmail</h2>
      <p>Click the button below to connect your Gmail account and capture a refresh token.</p>
      <button id="authBtn">Connect with Google</button>
      <div class="status" id="status"></div>
    </div>
    <script>
      const button = document.getElementById('authBtn');
      const statusEl = document.getElementById('status');
      button.addEventListener('click', async () => {
        button.disabled = true;
        statusEl.textContent = 'Generating consent link...';
        try {
          const response = await fetch('../google?state=browser');
          const data = await response.json();
          if (!data.url) {
            throw new Error('Unable to create consent URL');
          }
          statusEl.textContent = 'Redirecting to Google...';
          window.location.href = data.url;
        } catch (err) {
          statusEl.textContent = err.message || 'Something went wrong. Please retry.';
          button.disabled = false;
        }
      });
    </script>
  </body>
</html>`);
};

export const getGoogleAuthUrl = (req, res, next) => {
  try {
    const url = buildGoogleAuthUrl({ state: req.query.state });
    res.json({ url });
  } catch (error) {
    next(error);
  }
};

export const handleGoogleAuthCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ message: 'Missing authorization code' });
    }

    const tokens = await exchangeCodeForTokens(code);

    if (tokens.refresh_token) {
      await saveRefreshToken(tokens.refresh_token);
    }

    if (state === 'browser') {
      return res.send(buildSuccessHtml());
    }

    res.json({
      message: 'Authorization successful. Refresh token saved in database.',
    });
  } catch (error) {
    next(error);
  }
};

