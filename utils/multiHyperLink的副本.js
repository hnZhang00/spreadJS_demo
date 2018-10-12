
var MutipHyperLinkCellType = function(params) {
  this._links = params.links;
  this._linksTextWidth = []
  this._sumLinkTextWidth = 0;
};

var wrapText = function(text, x, y, maxWidth, lineHeight) {};

MutipHyperLinkCellType.prototype = new GC.Spread.Sheets.CellTypes.Text();

MutipHyperLinkCellType.prototype.paint = function (ctx, value, x, y, w, h, style, context) {
  console.log('ctx ===== ', ctx)
  console.log('value ===== ', value)
  console.log('x ===== ', x)
  console.log('y ===== ', y)
  console.log('w ===== ', w)
  console.log('h ===== ', h)
  console.log('style ===== ', style)
  console.log('context ===== ', context)
  var hyperStyle = new GC.Spread.Sheets.Style()
  hyperStyle.foreColor = 'blue';
  hyperStyle.font = style.font;
  hyperStyle.textDecoration = GC.Spread.Sheets.TextDecorationType.underline;

  ctx.font = style.font;

  this._sumLinkTextWidth = 0;
  this._linksTextWidth = []
  for (var i = 0; i < this._links.length; i++) {
    var textWidth = parseInt(ctx.measureText(this._links[i].text).width.toString()) + 3;
    this._linksTextWidth.push(textWidth);
    // GC.Spread.Sheets.CellTypes.Text.prototype.paint.call(this, ctx, this._links[i].text, x + this._sumLinkTextWidth, y, w, h, hyperStyle, context)
    GC.Spread.Sheets.CellTypes.Text.prototype.paint.call(this, ctx, this._links[i].text, x, y + i*20, w, h, hyperStyle, context)
    this._sumLinkTextWidth += textWidth;
  }

  GC.Spread.Sheets.CellTypes.Text.prototype.paint.call(this, ctx, value, x, y, w, h, style, context)
}

MutipHyperLinkCellType.prototype.getHitInfo = function (x, y, cellStyle, cellRect, context) {
  // console.log(x, y, cellStyle, cellRect, context)

  var info = {
    x: x,
    y: y,
    row: context.row,
    col: context.col,
    cellStyle: cellStyle,
    cellRect: cellRect,
    sheetArea: context.sheetArea
  };

  if (x < cellRect.x + this._sumLinkTextWidth) {
    var startX = cellRect.x
    for (var i = 0; i < this._links.length; i++) {
      if (x < startX + this._linksTextWidth[i]) {
        info.isReservedLocation = true;
        info.reservedLocation = i;
        break;
      }
      startX += (this._linksTextWidth[i]);
    }
  }

  return info;
}

MutipHyperLinkCellType.prototype.processMouseMove = function (hitInfo) {
  var sheet = hitInfo.sheet;
  var div = sheet.getParent().getHost();
  var canvasId = div.id + "vp_vp";
  var canvas = document.getElementById(canvasId);
  if (sheet && hitInfo.isReservedLocation) {
    canvas.style.cursor = 'pointer';
    return true;
  } else {
    canvas.style.cursor = 'default';
  }
  return false;
};

MutipHyperLinkCellType.prototype.processMouseUp = function (hitInfo) {
  var sheet = hitInfo.sheet;
  if (sheet && hitInfo.isReservedLocation && hitInfo.reservedLocation >= 0) {
    var row = hitInfo.row, col = hitInfo.col, sheetArea = hitInfo.sheetArea;
    var thisLink = this._links[hitInfo.reservedLocation];
    window.open(thisLink.url);
    return true;
  }
  return false;
};