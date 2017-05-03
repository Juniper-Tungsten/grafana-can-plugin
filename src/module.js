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

import {GenericDatasource} from './datasource';
import {GenericDatasourceQueryCtrl} from './query_ctrl';

class GenericConfigCtrl {
  constructor($scope) {
    this.current.url = this.current.url;
    this.current.jsonData = this.current.jsonData || {};
    this.current.jsonData.keystoneUrl = this.current.jsonData.keystoneUrl;
    this.current.jsonData.canPassword = this.current.jsonData.canPassword;
    this.current.jsonData.canUsername = this.current.jsonData.canUsername;
  }
}

GenericConfigCtrl.templateUrl = 'partials/config.html';

class GenericQueryOptionsCtrl {}
GenericQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

class GenericAnnotationsQueryCtrl {}
GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';

export {
  GenericDatasource as Datasource,
  GenericDatasourceQueryCtrl as QueryCtrl,
  GenericConfigCtrl as ConfigCtrl,
  GenericQueryOptionsCtrl as QueryOptionsCtrl,
  GenericAnnotationsQueryCtrl as AnnotationsQueryCtrl
};
