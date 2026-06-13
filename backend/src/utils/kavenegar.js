function getApiKey() {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  if (!apiKey) {
    throw new Error("KAVENEGAR_API_KEY تنظیم نشده است");
  }
  return apiKey;
}

async function parseKavenegarResponse(response) {
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch (_) {
    throw new Error("پاسخ نامعتبر از کاوه نگار");
  }

  if (!response.ok || body?.return?.status !== 200) {
    const status = body?.return?.status || response.status;
    const message = body?.return?.message || "خطا در ارسال پیامک";
    throw new Error(`Kavenegar ${status}: ${message}`);
  }

  return body;
}

async function sendKavenegarLookup({ receptor, template, token, token2, token3, type }) {
  if (!template) {
    throw new Error("نام template کاوه نگار تنظیم نشده است");
  }
  if (!receptor) {
    throw new Error("شماره گیرنده الزامی است");
  }

  const query = new URLSearchParams({
    receptor,
    template,
    token: String(token || "-"),
    type: type || process.env.KAVENEGAR_TYPE || "sms",
  });

  if (token2) query.set("token2", String(token2));
  if (token3) query.set("token3", String(token3));

  const endpoint = `https://api.kavenegar.com/v1/${getApiKey()}/verify/lookup.json?${query.toString()}`;
  const response = await fetch(endpoint, { method: "GET" });
  return parseKavenegarResponse(response);
}

async function sendKavenegarSms({ receptor, message }) {
  if (!receptor) {
    throw new Error("شماره گیرنده الزامی است");
  }
  if (!message) {
    throw new Error("متن پیامک الزامی است");
  }

  const body = new URLSearchParams({
    receptor,
    message,
  });

  if (process.env.KAVENEGAR_SENDER) {
    body.set("sender", process.env.KAVENEGAR_SENDER);
  }

  const endpoint = `https://api.kavenegar.com/v1/${getApiKey()}/sms/send.json`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded; charset=utf-8" },
    body: body.toString(),
  });
  return parseKavenegarResponse(response);
}

module.exports = {
  sendKavenegarLookup,
  sendKavenegarSms,
};
