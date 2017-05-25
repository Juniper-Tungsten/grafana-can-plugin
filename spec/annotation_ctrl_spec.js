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
