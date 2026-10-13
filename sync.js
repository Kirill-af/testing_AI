const SOURCE_URL = process.env.ORDERS_URL || "https://test.ooobs.ru/api/orders";

function normalizePhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  let national = digits;

  if (digits.length === 11 && digits.startsWith("8")) {
    national = "7" + digits.slice(1);
  } else if (digits.length === 10) {
    national = "7" + digits;
  } else if (!(digits.length === 11 && digits.startsWith("7"))) {
    return null;
  }

  if (national.length !== 11 || !national.startsWith("7")) {
    return null;
  }

  return `+${national}`;
}

function isPreferred(candidate, current) {
  if (candidate.amount !== current.amount) {
    return candidate.amount > current.amount;
  }
  return Date.parse(candidate.createdAt) > Date.parse(current.createdAt);
}

function syncOrders(orders) {
  const received = Array.isArray(orders) ? orders.length : 0;
  const list = Array.isArray(orders) ? orders : [];
  const byPhone = new Map();
  let invalidDropped = 0;

  list.forEach((order, index) => {
    const phone = normalizePhone(order && order.phone);
    if (!phone) {
      invalidDropped += 1;
      return;
    }

    const candidate = {
      name: order.name ?? "",
      phone,
      email: order.email ?? "",
      amount: Number(order.amount),
      createdAt: order.created_at,
      index,
    };

    const current = byPhone.get(phone);
    if (!current || isPreferred(candidate, current)) {
      byPhone.set(phone, candidate);
    }
  });

  const clients = [...byPhone.values()]
    .sort((a, b) => a.index - b.index)
    .map(({ name, phone, email, amount }) => ({ name, phone, email, amount }));

  const unique = clients.length;

  return {
    clients,
    stats: {
      received,
      unique,
      duplicates_merged: received - invalidDropped - unique,
      invalid_dropped: invalidDropped,
    },
  };
}

async function buildResult(sourceUrl = SOURCE_URL) {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Upstream responded with ${response.status}`);
  }
  const orders = await response.json();
  return syncOrders(orders);
}

module.exports = {
  SOURCE_URL,
  normalizePhone,
  syncOrders,
  buildResult,
};
