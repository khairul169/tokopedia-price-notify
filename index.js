const { Client, LocalAuth } = require("whatsapp-web.js");

const client = new Client({
  puppeteer: {
    headless: false,
  },
  authStrategy: new LocalAuth({
    dataPath: "./userData/",
  }),
});

let ready = false;

client.on("qr", (qr) => {
  console.log("QR RECEIVED", qr);
});

client.on("ready", () => {
  ready = true;
  console.log("WA Client is ready!");
});

const selector = {
  product: '[data-testid^="product"]',
  productName: '[data-testid="cartPDPName"]',
  productPrice: '[data-testid="cartProductPrice"]',
};

const trackProducts = ["GTX 1660 6GB HYNIX", "INBEX Wired Headset"];

const logMessage = async (message) => {
  if (!ready) {
    return;
  }

  console.log(message);
  const waNumber = "6289694230818@c.us";
  await client.sendMessage(waNumber, message);
};

const main = async () => {
  const browser = client.pupBrowser;
  const page = await browser.newPage();
  await page.goto("https://www.tokopedia.com/cart");
  await page.waitForTimeout(15000);

  const trackedProducts = [];

  const onRefresh = async () => {
    await page.waitForSelector(selector.product);

    const items = await page.$$eval(
      selector.product,
      (items, selector) => {
        return items.map((i) => {
          const name = i.querySelector(selector.productName).textContent;
          const price = parseInt(
            i
              .querySelector(selector.productPrice)
              .textContent.replace(/\D/g, ""),
            10
          );

          return { name, price };
        });
      },
      selector
    );

    trackProducts.forEach((itemName) => {
      const item = items.find((i) =>
        i.name.toLowerCase().includes(itemName.toLowerCase())
      );
      if (!item) {
        return;
      }

      let trackItem = trackedProducts.find((i) => i.name === item.name);
      if (!trackItem) {
        trackItem = { ...item };
        trackedProducts.push(trackItem);
        logMessage(`TRACKING ITEM ${JSON.stringify(trackItem)}`);
      }

      if (trackItem.price !== item.price) {
        logMessage(
          `PRICE CHANGE ${JSON.stringify(trackItem)}, ${JSON.stringify(item)}`
        );
        trackItem.price = item.price;
      }
    });
  };

  onRefresh();
  setInterval(async () => {
    await page.reload();
    onRefresh();
  }, 3000);
};

(() => {
  client.initialize();
  setTimeout(main, 1000);
})();
