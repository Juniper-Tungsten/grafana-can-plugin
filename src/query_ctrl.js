// The MIT License (MIT)

// Copyright (c) 2016 Grafana
// Copyright 2017, Juniper Networks, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import _ from 'lodash';
import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!';
import Common from './common';

export class GenericDatasourceQueryCtrl extends QueryCtrl {

  constructor($scope, $injector, uiSegmentSrv) {
    super($scope, $injector);

    this.scope = $scope;
    this.uiSegmentSrv = uiSegmentSrv;
    this.target.table = this.target.table || Common.strings.selectTable;
    // TODO: support the table view.
    // TODO: support rawQuery
    this.target.type = this.target.type || 'timeserie';
    this.target.pCols = this.target.pCols || false;
    this.target.selCol = this.target.selCol || null;
    this.target.allCols = this.target.allCols || null;
    this.target.advanced = this.target.advanced || false;
    this.target.filterObj = this.target.filterObj || {};
    this.target.filterObj.selFilterOp = this.target.filterObj.selFilterOp || null;
    this.target.filterObj.filterVal = this.target.filterObj.filterVal || null;
    this.target.filterObj.filterVal2 = this.target.filterObj.filterVal2 || null;
    this.target.whereArray = this.target.whereArray || [[{name: 'name', value: null, op: 'PREFIX'}]];
    this.randomId = this.randomId || 0;
  }

  getTables() {
    let param = {};
    param.start = Common.toDate(this.panelCtrl.dashboard.time.from);
    param.end = Common.toDate(this.panelCtrl.dashboard.time.end);
    return this.datasource.metricFindQuery(param)
      .then(this.uiSegmentSrv.transformToSegments(false));
      // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
      // return this.datasource.metricFindQuery(this.target);
  }

  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  onChangeTable() {
    let selectedTable = this.target.table;
    if (!selectedTable.includes(Common.strings.selectTable)) {
      this.datasource.getColumns(selectedTable).then((result) => {
        this.target.pCols = _.map(result.filtered, (d, i) => {
          return d.text;
        });
        this.target.pCols.unshift(Common.strings.selectColumn);
        // this.target.pCols.unshift({text:Common.strings.selectColumn});
        this.target.allCols = result.unfiltered;
      });
    }
  }

  colSelect() {
    // this.target.selCol = _.find(this.target.pCols, (obj)=>{
    //   return obj.text === this.target.viewSelCol;
    // });
    if (this.target.selCol) { this.panelCtrl.refresh(); } // Asks the panel to refresh data.
  }

  getOperators(colName = null) {
    if (colName != null) {
      // TODO: filter operators based on col datatype
      return Common.allOperators;
    }
    return Common.allOperators;
  }

  addOrRow() {
    this.target.whereArray.push([{}]);
  }

  addAndRow(index) {
    this.target.whereArray[index].push({});
  }

  delAndRow(pIndex, index) {
    this.target.whereArray[pIndex].splice(index, 1);
    if (this.target.whereArray[pIndex].length === 0) { this.target.whereArray.splice(pIndex, 1); }
  }

  getIndexCols() {
    let filteredIndex = [];
    _.each(this.target.allCols, (d, i) => {
      if (d.index === true) { filteredIndex.push(d.text); }
    });
    return filteredIndex;
  }

  getRandomId() {
    // TODO: Solve this using the tabindex of the pointer a element up in the
    // parent hierarchy.
    this.randomId = 'chechbox-id' + Math.floor(Math.random() * 10000000);
    return this.randomId;
  }
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

