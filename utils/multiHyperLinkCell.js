
var CELL_WIDTH = 64;
var CELL_HEIGHT = 21;
var CELL_LINE_HEIGHT = 20;

var MultiHyperLinkCellType = function(params) {
  this._links = params.links;
  this._linksTextHeight = 0;
};

MultiHyperLinkCellType.prototype = new GC.Spread.Sheets.CellTypes.Text();

MultiHyperLinkCellType.prototype._wrapLink = function(ctx, x, y, cellWidth, cellHeight, hyperStyle, context, link) {
  if (!ctx || !link || !link.text || typeof link.text != 'string' || typeof x != 'number' || typeof y != 'number')
    return;

  var text = link.text;
  var arrText = text.split('');
  var line = '';
  var maxWidth = cellWidth || CELL_WIDTH;
  var lineHeight = CELL_LINE_HEIGHT;

  link.width = Math.ceil(ctx.measureText(text).width);
  link.height = lineHeight;
  
  // 实现换行
  for (var n = 0; n < arrText.length; n++) {
    var testLine = line + arrText[n];
    var metrics = ctx.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      GC.Spread.Sheets.CellTypes.Text.prototype.paint.call(this, ctx, line, x, y, cellWidth, cellHeight, hyperStyle, context)
      line = arrText[n];
      y += lineHeight;
      link.height += lineHeight;
      link.width = Math.ceil(maxWidth);
    } else {
      line = testLine;
    }
  }
  if (line) {
    GC.Spread.Sheets.CellTypes.Text.prototype.paint.call(this, ctx, line, x, y, cellWidth, cellHeight, hyperStyle, context)
  }
};

MultiHyperLinkCellType.prototype.paint = function (ctx, value, x, y, cellWidth, cellHeight, style, context) {
  var hyperStyle = new GC.Spread.Sheets.Style()
  hyperStyle.foreColor = '#00b1fb';
  hyperStyle.font = style.font;
  hyperStyle.textDecoration = GC.Spread.Sheets.TextDecorationType.underline;

  ctx.font = style.font;

  for (var i = 0; i < this._links.length; i++) {
    // GC.Spread.Sheets.CellTypes.Text.prototype.paint.call(this, ctx, this._links[i].text, x + this._sumLinkTextWidth, y, cellWidth, cellHeight, hyperStyle, context)
    this._wrapLink(ctx, x, y, cellWidth, cellHeight, hyperStyle, context, this._links[i]);
    this._linksTextHeight += (this._links[i].height + 3);
    y += (this._links[i].height + 3);
  }
  // console.log(this._links)
}

MultiHyperLinkCellType.prototype.getAutoFitHeight = function (value, text, cellStyle, zoomFactor, context){
  
  return this._linksTextHeight;
}

MultiHyperLinkCellType.prototype.getHitInfo = function (x, y, cellStyle, cellRect, context) {
  var info = {
    x: x,
    y: y,
    row: context.row,
    col: context.col,
    cellStyle: cellStyle,
    cellRect: cellRect,
    sheetArea: context.sheetArea
  };

  var startX = cellRect.x;
  var startY = cellRect.y;
  for (var i = 0; i < this._links.length; i++) {
    if (x <= startX + this._links[i].width && y < startY + this._links[i].height) {
      info.isReservedLocation = true;
      info.reservedLocation = i;
      break;
    }
    startY += (this._links[i].height + 3);
  }

  return info;
}

MultiHyperLinkCellType.prototype.processMouseMove = function (hitInfo) {
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

MultiHyperLinkCellType.prototype.processMouseUp = function (hitInfo) {
  var sheet = hitInfo.sheet;
  if (sheet && hitInfo.isReservedLocation && hitInfo.reservedLocation >= 0) {
    var row = hitInfo.row, col = hitInfo.col, sheetArea = hitInfo.sheetArea;
    var thisLink = this._links[hitInfo.reservedLocation];
    var downloadLink = document.createElement('a');
    downloadLink.setAttribute('target', '_blank');
    downloadLink.setAttribute('href', thisLink.url);
    downloadLink.setAttribute('download', thisLink.text);
    downloadLink.click();
    return true;
  }
  return false;
};