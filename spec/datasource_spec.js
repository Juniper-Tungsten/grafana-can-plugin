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

import {Datasource} from '../module';
import Q from 'q';

describe('GenericDatasource', function () {
  let ctx = {};

  beforeEach(function () {
    // ctx.Common = Common;
    ctx.$q = Q;
    ctx.backendSrv = {};
    ctx.templateSrv = {};
    ctx.ds = new Datasource({}, ctx.$q, ctx.backendSrv, ctx.templateSrv);
  });

  it('should return success when credentials are correct', function (done) {
    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        status: 200,
        data: {
          access: {
            token: {id: '140000000', expires: 1497409035845}
          }
        }
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };

    ctx.ds.testDatasource().then(function (result) {
      expect(result.status).to.equal('success');
      done();
    });
  });

  it('should return failure when credentials are wrong', function (done) {
    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        status: 200,
        data: {}
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };

    ctx.ds.testDatasource().then(function (result) {
      expect(result.status).to.equal('failure');
      done();
    });
  });

  it('should return an empty array when no targets are set', function (done) {
    ctx.ds.query({targets: []}).then(function (result) {
      expect(result.data).to.have.length(0);
      done();
    });
  });

  it('should return the server results when a target is set', function (done) {
    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        target: 'X',
        data: {
          value: [{
            T: '140000000',
            val: '1234'
          },
          {
            T: '140000001',
            val: '1235'
          }
          ]
        },
        config: {data: {select_fields: ['T', 'table_name']}}
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };


    let queryObj = {
      maxDataPoints: 100,
      range: {
        from: {_d: 'Fri May 05 2017 17:43:41 GMT+0530 (IST)'},
        to: {_d: 'Fri May 05 2017 17:43:41 GMT+0530 (IST)'}
      },
      targets: [
        {
          hide: false,
          table: 'table_random',
          selCol: 'random_col'
        }
      ]
    };
    // done();
    ctx.ds.query(queryObj).then(function (result) {
      expect(result.data).to.have.length(1);
      let series = result.data[0];
      expect(series.target).to.equal('table_name');
      expect(series.datapoints).to.have.length(2);
      done();
    });
  });

  it('should return the metric(table names) results', function (done) {
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

    ctx.ds.metricFindQuery({target: null}).then(function (result) {
      expect(result).to.have.length(2);
      expect(result[0].text).to.equal('Table1');
      expect(result[0].value).to.equal(0);
      expect(result[1].text).to.equal('Table2');
      expect(result[1].value).to.equal(1);
      // done();
    });

    ctx.ds.metricFindQuery({target: 'random_metric'}).then(function (result) {
      expect(result).to.have.length(2);
      expect(result[0].text).to.equal('Table1');
      expect(result[0].value).to.equal(0);
      expect(result[1].text).to.equal('Table2');
      expect(result[1].value).to.equal(1);
      // done();
    });

    ctx.ds.metricFindQuery({}).then(function (result) {
      expect(result).to.have.length(2);
      expect(result[0].text).to.equal('Table1');
      expect(result[0].value).to.equal(0);
      expect(result[1].text).to.equal('Table2');
      expect(result[1].value).to.equal(1);
      done();
    });


  });

  it('should throw error when args are undefined', function (done) {
    global.assert.throw(function () { ctx.ds.metricFindQuery(); }, Error, "Cannot read property 'start' of undefined");
    done();
  });

  it('should throw error when args are null', function (done) {
    global.assert.throw(function () { ctx.ds.metricFindQuery(null); }, Error, "Cannot read property 'start' of null");
    done();
  });

  it('should return data as text and as value', function (done) {
    let result = ctx.ds.mapToTextValue({data: {value: [{'fields.value': 'zero'},
                                                       {'fields.value': 'one'},
                                                       {'fields.value': 'two'}]}});

    expect(result).to.have.length(3);
    expect(result[0].text).to.equal('zero');
    expect(result[0].value).to.equal(0);
    expect(result[1].text).to.equal('one');
    expect(result[1].value).to.equal(1);
    expect(result[2].text).to.equal('two');
    expect(result[2].value).to.equal(2);
    done();
  });

});
