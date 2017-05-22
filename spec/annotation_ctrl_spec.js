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

import sinon from 'sinon';
import Q from 'q';
// import {QueryCtrl} from 'app/plugins/sdk';
import {AnnotationsQueryCtrl} from '../module';
import {Datasource} from '../module';
import Common from '../common';

describe('Annotation Query Ctrl', function () {
  let ctx = {};
  beforeEach(function () {
    // ctx.Common = Common;
    ctx.$q = Q;
    ctx.backendSrv = {};
    ctx.templateSrv = {};
    ctx.uiSegmentSrv = {transformToSegments: function () {}};
    ctx.ds = new Datasource({}, ctx.$q, ctx.backendSrv, ctx.templateSrv);
  });

  it('[constructor] should set all and index columns', function (done) {
    let datasourceRequestMock = sinon.stub();
    const dataObj = Object.freeze({
      'type': 'STAT',
      'columns': [
        {'datatype': 'int', 'index': false, 'name': 'MessageTS', 'select': null, 'suffixes': null},
        {'datatype': 'string', 'index': true, 'name': 'Source', 'select': null, 'suffixes': null},
        {'datatype': 'string', 'index': true, 'name': 'ModuleId', 'select': null, 'suffixes': null},
        {'datatype': 'string', 'index': true, 'name': 'Category', 'select': null, 'suffixes': null},
        {'datatype': 'int', 'index': true, 'name': 'Level', 'select': null, 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'Type', 'select': null, 'suffixes': null},
        {'datatype': 'string', 'index': false, 'name': 'InstanceId', 'select': null, 'suffixes': null},
        {'datatype': 'string', 'index': false, 'name': 'NodeType', 'select': null, 'suffixes': null},
        {'datatype': 'string', 'index': true, 'name': 'Messagetype', 'select': null, 'suffixes': null}, 
        {'datatype': 'int', 'index': false, 'name': 'SequenceNum', 'select': null, 'suffixes': null},
        {'datatype': 'string', 'index': false, 'name': 'Context', 'select': null, 'suffixes': null},
        {'datatype': 'string', 'index': true, 'name': 'Keyword', 'select': null, 'suffixes': null},
        {'datatype': 'string', 'index': false, 'name': 'Xmlmessage', 'select': null, 'suffixes': null}
      ]
    });
    let allCols = ['MessageTS', 'Source', 'ModuleId', 'Category', 'Level', 'Type', 'InstanceId', 'NodeType', 'Messagetype', 'SequenceNum', 'Context', 'Keyword', 'Xmlmessage'];
    let indexCols = ['Source', 'ModuleId', 'Category', 'Level', 'Messagetype', 'Keyword'];
    const retObj = ctx.$q.when({
      target: 'X',
      data: dataObj,
      config: {data: {select_fields: ['T', 'table_name']}}
    });
    datasourceRequestMock.returns(retObj);
    ctx.ds.backendSrv.datasourceRequest = datasourceRequestMock;
    AnnotationsQueryCtrl.prototype.datasource = ctx.ds;
    let annotationCtrlMock = new AnnotationsQueryCtrl();
    let resAllCols = annotationCtrlMock.getAllCols();
    let resIndexCols = annotationCtrlMock.getIndexCols();
    Promise.all([resAllCols, resIndexCols]).then((values) => {
      expect(values[0]).to.deep.equal(allCols);
      expect(values[1]).to.deep.equal(indexCols);
      done();
    });
  });
  
  it('[getOperators] should return all operators', function (done) {
    let annotationCtrl = new AnnotationsQueryCtrl();
    expect(annotationCtrl.getOperators()).to.deep.equal(Common.allOperators);
    done();
  });
});
