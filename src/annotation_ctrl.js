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
import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!';
import Common from './common';

export class GenericAnnotationsQueryCtrl {

  constructor() {
    this.annontation = {};
  }
  getOperators() {
    return Common.allOperators;
  }
  getIndexCols() {
    return Common.annotationColIndex;
  }
  getAllCols() {
    return Common.annotationColAll;
  }

  // getRandomId() {
  //   // TODO: Solve this using the tabindex of the pointer a element up in the
  //   // parent hierarchy.
  //   this.randomId = 'chechbox-id' + Math.floor(Math.random() * 10000000);
  //   return this.randomId;
  // }
}
GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';

