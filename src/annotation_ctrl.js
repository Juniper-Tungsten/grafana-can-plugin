// The MIT License (MIT)

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
import './css/query-editor.css!';
import Common from './common';

export class GenericAnnotationsQueryCtrl {

  constructor() {
    this.annontation = {};
    this.allCols = null;
    this.indexCols = null;
    this.indexCols = this.getIndexCols();
    this.allCols = this.getAllCols();
  }
  getOperators() {
    return Common.allOperators;
  }
  getIndexCols() {
    if (this.indexCols)
      return this.indexCols;
    let selectedTable = Common.annotationTable;
    return this.datasource.getColumns(selectedTable).then((result) => {
      this.indexCols = [];
      _.each(result.unfiltered, (d, i) => {
        if (d.index === true) { this.indexCols.push(d.text); }
      });
      return this.indexCols;
    });
  }
  getAllCols() {
    if (this.allCols)
      return this.allCols;
    let selectedTable = Common.annotationTable;
    return this.datasource.getColumns(selectedTable).then((result) => {
      this.allCols = [];
      _.each(result.unfiltered, (d, i) => {
        this.allCols.push(d.text);
      });
      return this.allCols;
    });
  }
}
GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';

