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
import {QueryCtrl} from '../module';
import {Datasource} from '../module';
import Common from '../common';

describe('Query Ctrl', function () {
  let ctx = {};

  beforeEach(function () {
    // ctx.Common = Common;
    ctx.$q = Q;
    ctx.backendSrv = {};
    ctx.templateSrv = {};
    ctx.uiSegmentSrv = {transformToSegments: function () {}};
    ctx.qc = new QueryCtrl({}, {}, ctx.uiSegmentSrv);
    ctx.ds = new Datasource({}, ctx.$q, ctx.backendSrv, ctx.templateSrv);
    ctx.qc.datasource = ctx.ds;
  });

  it('[getTables] should return tables', function (done) {
    ctx.qc.panelCtrl = {dashboard: {time: {from: 1, end: 2}}};
    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        data: {
          value: [{'fields.value': 'Table1'},
                  {'fields.value': 'Table2'}
          ]
        }
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };
    let expectedRes = [
        {text: 'Table1', value: 0},
        {text: 'Table2', value: 1}
    ];
    ctx.qc.getTables().then((res) => {
      expect(res).to.deep.equal(expectedRes);
      done();
    });
  });

  it('[toggleEditorMode] should toggle variable', function (done) {
    ctx.qc.target.rawQuery = true;
    ctx.qc.toggleEditorMode();
    expect(ctx.qc.target.rawQuery).to.be.false;
    ctx.qc.toggleEditorMode();
    expect(ctx.qc.target.rawQuery).to.be.true;
    done();
  });

  it('[onChangeTable] should call getColumns', function (done) {
    ctx.qc.target.table = 'myTable';
    let datasourceRequestMock = sinon.stub();
    let dataObj = {
      'type': 'STAT',
      'columns': [
        {'datatype': 'string', 'index': true, 'name': 'Source', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'T', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'CLASS(T)', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'T=', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'CLASS(T=)', 'suffixes': null},
        {'datatype': 'uuid', 'index': false, 'name': 'UUID', 'suffixes': null},
        {'datatype': 'int', 'index': false, 'name': 'COUNT(counters)', 'suffixes': null}
      ]
    };
    let filteredRes = ['Select Field', 'COUNT(counters)'];
    let unfilteredRes = [
      {'type': 'string', 'index': true, 'text': 'Source', 'value': 0},
      {'type': 'int', 'index': false, 'text': 'T', 'value': 1},
      {'type': 'int', 'index': false, 'text': 'CLASS(T)', 'value': 2},
      {'type': 'int', 'index': false, 'text': 'T=', 'value': 3},
      {'type': 'int', 'index': false, 'text': 'CLASS(T=)', 'value': 4},
      {'type': 'uuid', 'index': false, 'text': 'UUID', 'value': 5},
      {'type': 'int', 'index': false, 'text': 'COUNT(counters)', 'value': 6}
    ];
    let retObj = ctx.$q.when({
      target: 'X',
      data: dataObj,
      config: {data: {select_fields: ['T', 'table_name']}}
    });
    datasourceRequestMock.returns(retObj);
    ctx.ds.backendSrv.datasourceRequest = datasourceRequestMock;
    ctx.qc.onChangeTable();
    setTimeout(() => {
      expect(ctx.qc.target.pCols).to.deep.equal(filteredRes);
      expect(ctx.qc.target.allCols).to.deep.equal(unfilteredRes);
      done();
    }, 30);
  });

  it('[colSelect] should call panel refresh', function (done) {
    let refreshMock = sinon.spy();
    ctx.qc.panelCtrl = {refresh: refreshMock};
    ctx.qc.target.selCol = null;
    ctx.qc.colSelect();
    expect(refreshMock.calledOnce).to.be.false;
    ctx.qc.target.selCol = 'someCol';
    ctx.qc.colSelect();
    expect(refreshMock.calledOnce).to.be.true;
    done();
  });

  it('[getOperators] should return allOperators', function (done) {
    let res = ctx.qc.getOperators();
    expect(res).to.deep.equal(Common.allOperators);
    res = ctx.qc.getOperators('someName');
    expect(res).to.deep.equal(Common.allOperators);
    done();
  });

  it('[addOrRow] should add an empty OR row', function (done) {
    ctx.qc.target.whereArray = [];
    ctx.qc.addOrRow();
    expect(ctx.qc.target.whereArray.length).to.be.equal(1);
    expect(ctx.qc.target.whereArray).to.deep.equal([[{}]]);
    done();
  });

  it('[addAndRow] should add an empty AND row in a given OR row', function (done) {
    ctx.qc.target.whereArray = [];
    ctx.qc.addOrRow();
    ctx.qc.addAndRow(0);
    expect(ctx.qc.target.whereArray.length).to.be.equal(1);
    expect(ctx.qc.target.whereArray[0].length).to.be.equal(2);
    expect(ctx.qc.target.whereArray).to.deep.equal([[{}, {}]]);
    done();
  });

  it('[delAndRow] should delete an and row', function (done) {
    ctx.qc.target.whereArray = [[{some: 1}]];
    ctx.qc.addAndRow(0);
    ctx.qc.addAndRow(0);
    ctx.qc.delAndRow(0, 1);
    expect(ctx.qc.target.whereArray).to.deep.equal([[{some: 1}, {}]]);
    ctx.qc.delAndRow(0, 1);
    expect(ctx.qc.target.whereArray).to.deep.equal([[{some: 1}]]);
    ctx.qc.delAndRow(0, 0);
    expect(ctx.qc.target.whereArray).to.deep.equal([]);
    done();
  });

  it('[getIndexCols] should return indexed cols', function (done) {
    ctx.qc.target.allCols = [
      {'type': 'string', 'index': true, 'text': 'Source', 'value': 0},
      {'type': 'int', 'index': false, 'text': 'T', 'value': 1},
      {'type': 'int', 'index': true, 'text': 'CLASS(T)', 'value': 2},
      {'type': 'int', 'index': false, 'text': 'T=', 'value': 3},
      {'type': 'int', 'index': false, 'text': 'CLASS(T=)', 'value': 4},
      {'type': 'uuid', 'index': false, 'text': 'UUID', 'value': 5},
      {'type': 'int', 'index': false, 'text': 'COUNT(counters)', 'value': 6}
    ];
    let expectedRes = ['Source', 'CLASS(T)'];
    let res = ctx.qc.getIndexCols();
    expect(res).to.deep.equal(expectedRes);
    done();
  });

  it('[getRandomId] should return random id', function (done) {
    let allIds = [];
    let testFunc = function(i){
      if(i> 100)
        return done;
      let temp = ctx.qc.getRandomId();
      expect(allIds.indexOf(temp)).to.be.equal(-1);
      allIds.push(temp);
      return testFunc(i+1);
    };
    testFunc(0)();
    // done();
  });
});
