var MR = MR || {};

// Collision helpers. Every body and solid is a rectangle: { x, y, w, h }
// with (x, y) at the top-left corner.
MR.Physics = (function () {
  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function overlapsAny(rect, solids) {
    for (var i = 0; i < solids.length; i++) {
      if (overlaps(rect, solids[i])) return true;
    }
    return false;
  }

  function pointInSolid(x, y, solids) {
    for (var i = 0; i < solids.length; i++) {
      var s = solids[i];
      if (x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) return true;
    }
    return false;
  }

  // Moves body by (vx, vy) one axis at a time, pushing it back out of any
  // solid it runs into. Solids block from every side.
  function moveAndCollide(body, solids) {
    var result = { hitX: false, hitY: false, onGround: false };
    var i, s;

    body.x += body.vx;
    if (body.vx !== 0) {
      for (i = 0; i < solids.length; i++) {
        s = solids[i];
        if (!overlaps(body, s)) continue;
        body.x = body.vx > 0 ? s.x - body.w : s.x + s.w;
        result.hitX = true;
      }
      if (result.hitX) body.vx = 0;
    }

    body.y += body.vy;
    if (body.vy !== 0) {
      for (i = 0; i < solids.length; i++) {
        s = solids[i];
        if (!overlaps(body, s)) continue;
        if (body.vy > 0) {
          body.y = s.y - body.h;
          result.onGround = true;
        } else {
          body.y = s.y + s.h;
        }
        result.hitY = true;
      }
      if (result.hitY) body.vy = 0;
    }

    return result;
  }

  function shrink(r, by) {
    return { x: r.x + by, y: r.y + by, w: r.w - by * 2, h: r.h - by * 2 };
  }

  return {
    overlaps: overlaps,
    overlapsAny: overlapsAny,
    pointInSolid: pointInSolid,
    moveAndCollide: moveAndCollide,
    shrink: shrink
  };
})();
