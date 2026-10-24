var MR = MR || {};

// Gerald's Shop: visited after every level. Man Ray spends the pearls he has
// collected on upgrades, which then stay with him in every level.
//   create(wallet, owned, isLast)  owned: { rocket: true, ... }
//   update(shop, { left, right, choose, clickIndex }) -> 'bought' | 'done' | null
//   draw(ctx, shop, t)
MR.Shop = (function () {
  var W = 960, H = 540;
  var ITEMS = [
    { id: 'rocket', name: 'Rocket Launcher', price: 10, line: 'Press R to fire big rockets!' },
    { id: 'punch', name: 'Mega Punch', price: 20, line: 'Punches enemies that get close!' },
    { id: 'dog', name: 'Sausage Cowboy Hat', price: 30, line: 'A sausage dog friend chases fish and crabs!' }
  ];
  var GO = ITEMS.length; // the "Next level" button comes after the items

  var SAYS = {
    hello: 'Howdy, partner! What’ll it be?',
    bought: 'Pleasure doin’ business!',
    poor: 'Not enough pearls, partner.',
    owned: 'You’ve already got that one!'
  };

  // Card and button positions (also used for clicks).
  function cardRect(i) { return { x: 336 + i * 208, y: 112, w: 192, h: 262 }; }
  var GO_RECT = { x: 520, y: 400, w: 300, h: 58 };

  function create(wallet, owned, isLast) {
    var o = {};
    ITEMS.forEach(function (it) { o[it.id] = !!(owned && owned[it.id]); });
    return { sel: firstAffordable(wallet, o), wallet: wallet, owned: o, says: 'hello', saysTime: 0, done: false, isLast: !!isLast };
  }

  function firstAffordable(wallet, owned) {
    for (var i = 0; i < ITEMS.length; i++) {
      if (!owned[ITEMS[i].id] && wallet >= ITEMS[i].price) return i;
    }
    return GO;
  }

  // Tries to buy an item. Returns 'bought', 'owned' or 'poor'.
  function buy(shop, id) {
    var it = ITEMS.filter(function (x) { return x.id === id; })[0];
    if (shop.owned[id]) return 'owned';
    if (shop.wallet < it.price) return 'poor';
    shop.wallet -= it.price;
    shop.owned[id] = true;
    return 'bought';
  }

  function choose(shop, index) {
    shop.sel = index;
    if (index === GO) {
      shop.done = true;
      return 'done';
    }
    var result = buy(shop, ITEMS[index].id);
    shop.says = result;
    shop.saysTime = 0;
    return result;
  }

  function update(shop, input) {
    shop.saysTime++;
    if (input.left) shop.sel = (shop.sel + GO) % (GO + 1);
    if (input.right) shop.sel = (shop.sel + 1) % (GO + 1);
    if (input.clickIndex !== undefined && input.clickIndex !== null) return choose(shop, input.clickIndex);
    if (input.choose) return choose(shop, shop.sel);
    return null;
  }

  // Which card or button a click at (x, y) landed on, or null.
  function hitTest(x, y) {
    for (var i = 0; i < ITEMS.length; i++) {
      var r = cardRect(i);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
    }
    var g = GO_RECT;
    if (x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h) return GO;
    return null;
  }

  // ---------- drawing ----------

  function draw(ctx, shop, t) {
    var Art = MR.Art;
    MR.Background.draw(ctx, 300 + t * 0.15, t, MR.Themes.coral);
    ctx.fillStyle = 'rgba(30,60,90,0.25)';
    ctx.fillRect(0, 0, W, H);

    // Shop sign
    Art.roundRect(ctx, 300, 18, 360, 64, 18);
    ctx.fillStyle = '#b07a4f'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = Art.OUTLINE; ctx.stroke();
    Art.drawText(ctx, "Gerald's Shop", W / 2, 51, 38, '#ffe66b');

    // Wallet
    Art.drawPearl(ctx, W - 120, 50, t);
    Art.drawText(ctx, '× ' + shop.wallet, W - 100, 51, 34, '#ffffff', 'left');

    // Gerald behind his counter, with what he says
    Art.drawGerald(ctx, 160, 330, t, { talking: shop.saysTime < 60 });
    Art.roundRect(ctx, 20, 410, 300, 140, 14);
    ctx.fillStyle = '#9a6b3f'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = Art.OUTLINE; ctx.stroke();
    ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 3;
    for (var k = 0; k < 3; k++) {
      ctx.beginPath(); ctx.moveTo(30, 440 + k * 28); ctx.lineTo(310, 440 + k * 28); ctx.stroke();
    }
    speech(ctx, Art, SAYS[shop.says], 20, 104, 290);

    // Item cards
    ITEMS.forEach(function (it, i) { drawCard(ctx, Art, shop, it, i, t); });

    // Next level button
    var g = GO_RECT, sel = shop.sel === GO;
    var lift = sel ? Math.sin(t * 0.12) * 3 : 0;
    Art.roundRect(ctx, g.x, g.y - lift, g.w, g.h, g.h / 2);
    ctx.fillStyle = sel ? '#4cc36a' : '#8fd6a0'; ctx.fill();
    ctx.lineWidth = sel ? 5 : 3; ctx.strokeStyle = sel ? '#ffcf3f' : Art.OUTLINE; ctx.stroke();
    Art.drawText(ctx, shop.isLast ? 'All done!' : 'Next level', g.x + g.w / 2 - 14, g.y + g.h / 2 - lift + 1, 28, '#ffffff');
    Art.drawArrow(ctx, g.x + g.w - 40, g.y + g.h / 2 - lift, 0, 1.1, '#ffffff');

    if (Art.isTouch()) Art.drawText(ctx, 'Tap a card to buy it', 670, 506, 22, '#ffffff');
    else Art.drawPromptRow(ctx, [{ key: 'LEFT' }, { key: 'RIGHT' }, 'choose', { key: 'SPACE' }, 'buy'], 670, 506, 20);
  }

  function drawCard(ctx, Art, shop, it, i, t) {
    var r = cardRect(i);
    var sel = shop.sel === i;
    var owned = shop.owned[it.id];
    var canAfford = shop.wallet >= it.price;
    var lift = sel ? 6 + Math.sin(t * 0.12) * 3 : 0;
    var y = r.y - lift;

    Art.roundRect(ctx, r.x, y, r.w, r.h, 18);
    ctx.fillStyle = owned ? '#e6f7e9' : '#ffffff'; ctx.fill();
    ctx.lineWidth = sel ? 6 : 3; ctx.strokeStyle = sel ? '#ffcf3f' : Art.OUTLINE; ctx.stroke();

    // Picture
    Art.roundRect(ctx, r.x + 12, y + 12, r.w - 24, 112, 12);
    ctx.fillStyle = '#bfe9f2'; ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x + 12, y + 12, r.w - 24, 112); ctx.clip();
    Art.drawUpgradePicture(ctx, it.id, r.x + r.w / 2, y + 70, t);
    ctx.restore();

    // Name and what it does
    var size = 22;
    while (size > 15 && Art.measureText(ctx, it.name, size) > r.w - 20) size--;
    Art.drawText(ctx, it.name, r.x + r.w / 2, y + 146, size, Art.OUTLINE, 'center', 0);
    Art.drawWrapped(ctx, it.line, r.x + r.w / 2, y + 174, r.w - 26, 15, '#4a5670', 18);

    // Price, or a tick once owned
    if (owned) {
      Art.drawText(ctx, 'Got it! ✓', r.x + r.w / 2, y + r.h - 26, 22, '#2e9e4f', 'center', 0);
    } else {
      Art.drawPearl(ctx, r.x + r.w / 2 - 26, y + r.h - 26, t);
      Art.drawText(ctx, String(it.price), r.x + r.w / 2 - 8, y + r.h - 25, 26,
        canAfford ? Art.OUTLINE : '#c0392b', 'left', 0);
    }
  }

  function speech(ctx, Art, text, x, y, w) {
    Art.roundRect(ctx, x, y, w, 70, 18);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = Art.OUTLINE; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 120, y + 68); ctx.lineTo(x + 140, y + 92); ctx.lineTo(x + 152, y + 68);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.stroke();
    ctx.fillRect(x + 118, y + 64, 36, 6);
    Art.drawWrapped(ctx, text, x + w / 2, y + 26, w - 24, 20, Art.OUTLINE, 24);
  }

  return {
    ITEMS: ITEMS, GO: GO, SAYS: SAYS,
    create: create, buy: buy, update: update, hitTest: hitTest, draw: draw
  };
})();
