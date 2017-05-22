//  Copyright 2017, Juniper Networks, Inc.

//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

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

