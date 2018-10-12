window.onload = function() {
	// console.log(design)
	// console.log(Data)
	var spreadNS = GC.Spread.Sheets;
	var spread = new spreadNS.Workbook(document.getElementById('demo'), { sheetCount: 1 });
	spread.fromJSON(design);

	var bindData = new spreadNS.Bindings.CellBindingSource(Data);
	var activeSheet = spread.getSheet(0);
	activeSheet.setDataSource(bindData);
	activeSheet.options.isProtected = true;
	activeSheet.options.protectionOptions.allowDeleteRows = true;

	spread.suspendPaint();

	activeSheet.getRange(0, 0, activeSheet.getRowCount(), activeSheet.getColumnCount(), spreadNS.SheetArea.viewport).wordWrap(true);
	for (var i = 0; i < activeSheet.getRowCount(); i++) {
		activeSheet.autoFitRow(i);
	}

	function combineTableSpans() {
		var tables = activeSheet.tables.all();
		for (var tableIndex = 0; tableIndex < tables.length; tableIndex++) {
			var table = tables[tableIndex];
			// console.log(table)

			// 获取每张表的位置
			var tableRange = table.range();
			var startRow = tableRange.row + 1;
			var startCol = tableRange.col;
			var endRow = tableRange.row + tableRange.rowCount;
			for(var i = startRow + 1; i < endRow; i++){
				activeSheet.copyTo(startRow,startCol,i,startCol,1,tableRange.colCount,GC.Spread.Sheets.CopyToOptions.style | GC.Spread.Sheets.CopyToOptions.span);
			}
			
			
			/*// 获取每行中哪些列需要合并
			var colIndex = 0;
			var colDataField = '';
			var combineInfo = {};
			console.log(table.style())

			for (var colInRow = 0; colInRow < tableRange.colCount; colInRow++) {
				var thisDataField = table.getColumnDataField(colInRow);
				if (!colInRow) {
					colDataField = thisDataField;
					combineInfo[0] = 1;
				} else {
					if (colDataField === thisDataField) {
						// 跟上一列的dataField相同，为合并列
						combineInfo[colIndex]++;
					} else {
						colIndex = colInRow;
						colDataField = thisDataField;
						combineInfo[colIndex] = 1;
					}
				}
			}
			// console.log(combineInfo)

			// 合并每一行
			for (var tableRowIndex = 0; tableRowIndex < tableRange.rowCount; tableRowIndex++) {
				for (var combineCol in combineInfo) {
					activeSheet.addSpan(tableRange.row+tableRowIndex, parseInt(combineCol), 1, combineInfo[combineCol], GC.Spread.Sheets.SheetArea.viewport);
				}
			}*/
			
		}
	};
	combineTableSpans();

	var needAutoFitArray = [];
	function setSpecialCell(params) {
		var files = Data[params.name];
		if (!files || !files.length)
			return;
		var condition = new spreadNS.Search.SearchCondition();
		condition.searchTarget = spreadNS.Search.SearchFoundFlags.cellTag;
		condition.searchOrder = spreadNS.Search.SearchOrder.zOrder;
		condition.searchString = '[' + params.name + ']';
		
		var specialCell = activeSheet.search(condition);
		console.log(specialCell)
		var row = specialCell.foundRowIndex;
		var col = specialCell.foundColumnIndex;
		if (row === -1 || col === -1)
			return;

		needAutoFitArray.push({row: row, col: col});

		switch(params.type) {
			case 'file':
				var cellType = new MultiHyperLinkCellType({ links: files });
				activeSheet.setValue(row, col, '');
				activeSheet.setCellType(row, col, cellType);
				break;
			case 'image':
				var cellType = new ImageCellType({ images: files });
				activeSheet.setValue(row, col, '');
				activeSheet.setCellType(row, col, cellType);
				break;
		}
	};
	
	setSpecialCell({
		name: 'field-file',
		type: 'file'
	});
	setSpecialCell({
		name: 'field-image',
		type: 'image'
	});

	spread.resumePaint();

	// 这个autoFitRow只能放在spread.resumePaint()之后，不然会失效
	for (var i = 0; i < needAutoFitArray.length; i++) {
		activeSheet.autoFitRow(needAutoFitArray[i].row, needAutoFitArray[i].col);
	}
	// var rows = [ { firstRow: 17, lastRow: 18 } ];
	// spread.commandManager().execute({cmd: "resizeRow", sheetName: "Sheet1", rows: rows, size:600, isColHeader: false});

	var sc = new spreadNS.Search.SearchCondition();
	sc.searchTarget = spreadNS.Search.SearchFoundFlags.cellTag;
	sc.searchOrder = spreadNS.Search.SearchOrder.zOrder;
	sc.searchString = '[field-sub_form-image]';
	console.log(sc)

	window.printDemo = function() {
		console.log('printDemo')
		var printInfo = activeSheet.printInfo();
		//设置打印纸张为A4纸
		printInfo.paperSize(new spreadNS.Print.PaperSize(spreadNS.Print.PaperKind.a4));
		//设置边距
		printInfo.margin({top:0, bottom:0, left:0, right:0, header:0, footer:0});
		//设置横向打印
		printInfo.orientation(spreadNS.Print.PrintPageOrientation.landscape);
		//设置打印居中
		printInfo.centering(spreadNS.Print.PrintCentering.both);
		//设置缩放
		printInfo.zoomFactor(0.85);

		// printInfo.bestFitRows(true);
		// printInfo.bestFitColumns(true);

		// 隐藏列头
		printInfo.showColumnHeader(GC.Spread.Sheets.Print.PrintVisibilityType.hide);
		// 隐藏行头
		printInfo.showRowHeader(GC.Spread.Sheets.Print.PrintVisibilityType.hide);
		// 隐藏网格线
		printInfo.showGridLine = false;

		spread.print();
	};
};