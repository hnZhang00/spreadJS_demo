
var CELL_WIDTH = 64;
var CELL_HEIGHT = 21;
var CELL_LINE_HEIGHT = 20;
var IMAGE_WIDTH = 100;
var IMAGE_HEIGHT = 100;
var MARGIN_LEFT = 10;
var MARGIN_BOTTOM = 10;
var mynamespace = {};
var ImageCellType = function(params) {
	this.typeName = "mynamespace.ImageCellType";
	if(params){
		this._images = params.images;
	}
	this._imagesHeight = 0;
	this._autofitheight = 0;
	this._autofitwidth = 0;
};

ImageCellType.prototype = new GC.Spread.Sheets.CellTypes.Text();

ImageCellType.prototype._wrapImage = function(ctx, x, y, cellWidth, cellHeight, hyperStyle, context, image) {
  if (!ctx || !image || !image.file_name || typeof image.file_name != 'string' || typeof x != 'number' || typeof y != 'number')
    return;

  var text = image.file_name;
  var arrText = text.split('');
  var line = '';
  var imgWidth = IMAGE_WIDTH + MARGIN_LEFT;
  var maxWidth = (cellWidth || CELL_WIDTH) - imgWidth;
  var lineHeight = CELL_LINE_HEIGHT;

  image.imgWidth = imgWidth;
  image.textWidth = Math.ceil(ctx.measureText(text).width);
  image.textHeight = lineHeight;
  
  var backgroundImgStyle = new GC.Spread.Sheets.Style();
  backgroundImgStyle.backgroundImage = image.src;
  GC.Spread.Sheets.CellTypes.Text.prototype.paint.call(this, ctx, '', x, y, IMAGE_WIDTH, IMAGE_HEIGHT, backgroundImgStyle, context);

  x += imgWidth;
  // 实现换行
  for (var n = 0; n < arrText.length; n++) {
    var testLine = line + arrText[n];
    var metrics = ctx.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      GC.Spread.Sheets.CellTypes.Text.prototype.paint.call(this, ctx, line, x, y, cellWidth, cellHeight, hyperStyle, context);
      line = arrText[n];
      y += lineHeight;
      image.textHeight += lineHeight;
      image.textWidth = Math.ceil(maxWidth);
    } else {
      line = testLine;
    }
  }
  image.width = image.textWidth + imgWidth;
  image.height = image.textHeight > IMAGE_HEIGHT ? image.textHeight : IMAGE_HEIGHT;
  if (line) {
    GC.Spread.Sheets.CellTypes.Text.prototype.paint.call(this, ctx, line, x, y, cellWidth, cellHeight, hyperStyle, context);
  }
};

ImageCellType.prototype.paint = function (ctx, value, x, y, cellWidth, cellHeight, style, context) {
  var hyperStyle = new GC.Spread.Sheets.Style()
  hyperStyle.foreColor = '#00b1fb';
  hyperStyle.font = style.font;
  hyperStyle.textDecoration = GC.Spread.Sheets.TextDecorationType.underline;

  ctx.font = style.font;
  var autoheight = 0;
  for (var i = 0; i < this._images.length; i++) {
	autoheight += (this._images[i].height + MARGIN_BOTTOM);
    this._wrapImage(ctx, x, y, cellWidth, cellHeight, hyperStyle, context, this._images[i]);
    y += (this._images[i].height + MARGIN_BOTTOM);
  }
  this._imagesHeight = autoheight;
}

ImageCellType.prototype.getAutoFitHeight = function (value, text, cellStyle, zoomFactor, context){
  return this._imagesHeight;
}

ImageCellType.prototype.getHitInfo = function (x, y, cellStyle, cellRect, context) {
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
  for (var i = 0; i < this._images.length; i++) {
    if (x > startX + this._images[i].imgWidth && x <= startX + this._images[i].width && y < startY + this._images[i].textHeight) {
      info.isReservedLocation = true;
      info.reservedLocation = i;
      break;
    }
    startY += (this._images[i].height + MARGIN_BOTTOM);
  }

  return info;
}

ImageCellType.prototype.processMouseMove = function (hitInfo) {
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

ImageCellType.prototype.processMouseUp = function (hitInfo) {
  var sheet = hitInfo.sheet;
  if (sheet && hitInfo.isReservedLocation && hitInfo.reservedLocation >= 0) {
    var row = hitInfo.row, col = hitInfo.col, sheetArea = hitInfo.sheetArea;
    var thisImage = this._images[hitInfo.reservedLocation];
    var downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', thisImage.src);
    downloadLink.setAttribute('download', thisImage.file_name);
    downloadLink.click();
    return true;
  }
  return false;
};

mynamespace.ImageCellType = ImageCellType;