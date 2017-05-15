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
import Common from '../common';

describe('common.js', function () {
  let ctx = {};

  it('[toDate] should handle invalid arg', function (done) {
    let input = null;
    let res = Common.toDate(input);
    expect(res).to.be.equal(undefined);
    input = undefined;
    res = Common.toDate(input);
    expect(res).to.be.equal(undefined);
    input = '';
    res = Common.toDate(input);
    expect(res).to.be.equal(undefined);
    input = 'undefined';
    res = Common.toDate(input);
    expect(res).to.be.equal(undefined);
    input = {_f: 'undefined'};
    res = Common.toDate(input);
    expect(res).to.be.NaN;
    done();
  });

  it('[toDate] should handle valid arg', function (done) {
    let input = {_d: 'Fri May 05 2017 17:43:41 GMT+0530 (IST)'};
    let res = Common.toDate(input);
    expect(res).to.be.equal(1493986421000000);
    input = {_i: 'Fri May 05 2017 17:43:41 GMT+0530 (IST)'};
    res = Common.toDate(input);
    expect(res).to.be.equal(1493986421000000);
    input = {_d: '2017-05-13T17:52:22Z'};
    res = Common.toDate(input);
    expect(res).to.be.equal(1494697942000000);
    input = {_i: '2017-05-13T17:52:22Z'};
    res = Common.toDate(input);
    expect(res).to.be.equal(1494697942000000);
    done();
  });

  it('[getAuthDict] should pass proper object', function (done) {
    let res = Common.getAuthDict('user', 'pass');
    let retObj = {auth: {passwordCredentials:
      {username: 'user', password: 'pass'},
      tenantName: 'admin'}
    };
    expect(res).to.deep.equal(retObj);
    res = Common.getAuthDict('user', 'pass', 'newTenant');
    retObj = {auth: {passwordCredentials:
      {username: 'user', password: 'pass'},
      tenantName: 'newTenant'}
    };
    expect(res).to.deep.equal(retObj);
    res = Common.getAuthDict(null, undefined, 'newTenant');
    retObj = {auth: {passwordCredentials:
      {username: null, password: undefined},
      tenantName: 'newTenant'}
    };
    expect(res).to.deep.equal(retObj);
    done();
  });

  it('[processAuthResponse] should return null on response failure', function (done) {
    let input = {
      status: 500,
      data: {
        'access': {'token': {'id': 'id1', 'expires': '2017-05-13T17:52:22Z'}}
      }
    };
    let res = Common.processAuthResponse(input);
    expect(res).to.be.null;
    input = {
      status: 200,
      data: {
        access: undefined
      }
    };
    res = Common.processAuthResponse(input);
    expect(res).to.be.null;
    done();
  });

  it('[processAuthResponse] should return on response success', function (done) {
    let input = {
      status: 200,
      data: {
        'access': {'token': {'id': 'id1', 'expires': 'expire_time'}}
      }
    };
    let retObj = {
      token: 'id1',
      expire: 'expire_time'
    };
    let res = Common.processAuthResponse(input);

    expect(res).to.deep.equal(retObj);
    done();
  });

  it('[processResultData] should reurn processed obj', function (done) {
    let input = {
      data: {
        value: [
          {'T': 1000, 'CLASS(T)': 'someclass', 'someKey': 20 },
          {'T': 11000, 'CLASS(T)': 'someclass', 'someKey': 30 },
          {'T': 12000, 'CLASS(T)': 'someclass', 'someKey': 50 },
          {'T': 22000, 'CLASS(T)': 'someclass', 'someKey': 'someVal' },
        ]
      },
      config: {data: {select_fields: ['T', 'someCol']}}
    };
    let retObj = {
      target: 'someCol',
      datapoints: [[20, 1], [30, 11], [50, 12], ['someVal', 22]]
    };
    let res = Common.processResultData(input);
    expect(res).to.deep.equal(res);
    done();
  });

  it('[filterQueryFields] should return null when advanced flag is off', function (done) {
    let input = {advanced: null};
    let res = Common.filterQueryFields(input);
    expect(res.where).to.be.null;
    expect(res.filter).to.be.null;
    input = {advanced: ''};
    res = Common.filterQueryFields(input);
    expect(res.where).to.be.null;
    expect(res.filter).to.be.null;
    input = {advanced: undefined};
    res = Common.filterQueryFields(input);
    expect(res.where).to.be.null;
    expect(res.filter).to.be.null;
    done();
  });

  it('[filterQueryFields] should return filtered obj', function (done) {
    let inputs = {
      'targets': [
        {'hide': false,
          'table': 'someTable',
          'selCol': 'someCol',
          'advanced': true,
          'whereArray': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}]]},
        {'hide': false,
          'table': 'someTable',
          'selCol': 'someCol',
          'advanced': true,
          'whereArray': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}, {'op': 'LEQ', 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000'}], [{'op': 'GEQ', 'name': 'process_mem_cpu_usage.__key', 'value': '67'}]]},
        {'hide': false,
          'table': 'someTable',
          'selCol': 'someCol',
          'advanced': true,
          'filterObj': {'selFilterOp': 'IN_RANGE', 'filterVal': 9000000, 'filterVal2': 6000000},
          'whereArray': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}, {'op': 'LEQ', 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000'}], [{'op': 'GEQ', 'name': 'process_mem_cpu_usage.__key', 'value': '67'}]]},
        {'hide': false,
          'table': 'someTable',
          'selCol': 'someCol',
          'advanced': true,
          'filterObj': {'selFilterOp': 'IN_RANGE', 'filterVal': 9000000, 'filterVal2': 6000000},
          'whereArray': [[]]},
        {'hide': false,
          'table': 'someTable',
          'selCol': 'someCol',
          'advanced': true,
          'filterObj': {'selFilterOp': 'IN_RANGE', 'filterVal': 9000000, 'filterVal2': 6000000},
          'whereArray': [[{op: 'range_op', name: 'someName', value: 1}]]}
      ],
      'range': {'to': 'f', 'from': 'f'}
    };
    let expectedRes = [
      {'hide': false, 'advanced': true, 'table': 'someTable', 'selCol': 'someCol', 'where': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ', 'value2': undefined}]], 'filter': null, 'whereArray': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}]]},
      {'hide': false, 'advanced': true, 'table': 'someTable', 'selCol': 'someCol', 'where': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ', 'value2': undefined}, {'op': 'LEQ', 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000', 'value2': undefined}], [{'op': 'GEQ', 'name': 'process_mem_cpu_usage.__key', 'value': '67', 'value2': undefined}]], 'filter': null, 'whereArray': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}, {'op': 'LEQ', 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000'}], [{'op': 'GEQ', 'name': 'process_mem_cpu_usage.__key', 'value': '67'}]]},
      {'hide': false, 'advanced': true, 'table': 'someTable', 'selCol': 'someCol', 'where': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ', 'value2': undefined}, {'op': 'LEQ', 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000', 'value2': undefined}], [{'op': 'GEQ', 'name': 'process_mem_cpu_usage.__key', 'value': '67', 'value2': undefined}]], 'filter': {'selFilterOp': 'IN_RANGE', 'filterVal': 9000000, 'filterVal2': 6000000}, 'whereArray': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}, {'op': 'LEQ', 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000'}], [{'op': 'GEQ', 'name': 'process_mem_cpu_usage.__key', 'value': '67'}]], 'filterObj': {'selFilterOp': 'IN_RANGE', 'filterVal': 9000000, 'filterVal2': 6000000}},
      {'hide': false, 'advanced': true, 'table': 'someTable', 'selCol': 'someCol', 'where': null, 'filter': {'selFilterOp': 'IN_RANGE', 'filterVal': 9000000, 'filterVal2': 6000000}, 'whereArray': [[]], 'filterObj': {'selFilterOp': 'IN_RANGE', 'filterVal': 9000000, 'filterVal2': 6000000}},
      {'hide': false, 'advanced': true, 'table': 'someTable', 'selCol': 'someCol', 'where': null, 'filter': {'selFilterOp': 'IN_RANGE', 'filterVal': 9000000, 'filterVal2': 6000000}, 'whereArray': [[{op: 'range_op', name: 'someName', value: 1}]], 'filterObj': {'selFilterOp': 'IN_RANGE', 'filterVal': 9000000, 'filterVal2': 6000000}}
    ];
    let testFunc = function(index) {
      if (index > expectedRes.length - 1) {
        return done;
      }
      let res = Common.filterQueryFields(inputs.targets[index]);
      expect(res).to.deep.equal(expectedRes[index]);
      return testFunc(index + 1);
    };
    testFunc(0)();
  });

  it('[isValidQuery] should return false on invalid obj', function (done) {
    let input = {
      table: undefined,
      selCol: '',
    };
    let res = Common.isValidQuery(input);
    expect(res).to.be.false;
    done();
  });

  it('[transform] should return the tranformed filter and where properties', function (done) {
    let inputs = [
      {filter: null, where: null},
      {'selCol': 'someCol',
        'filter': {filterVal: 1, selFilterOp: 'GEQ'},
        'where': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 'GEQ'}, {'op': 'LEQ', 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000'}], [{'op': 'GEQ', 'name': 'process_mem_cpu_usage.__key', 'value': '67'}]]},
    ];
    let expectedRes = [
      {filter: null, where: null},
      {'selCol': 'someCol',
        'filter': [{name: 'someCol', value: 1, op: 6, value2: undefined}],
        'where': [[{'name': 'process_mem_cpu_usage.cpu_share', 'value': '6000000', 'op': 6}, {'op': 5, 'name': 'process_mem_cpu_usage.cpu_share', 'value': '10000000'}], [{'op': 6, 'name': 'process_mem_cpu_usage.__key', 'value': '67'}]]}
    ];
    let testFunc = function(index) {
      if(index >= expectedRes.length) {
        return done;
      }
      let res = Common.transform(inputs[index]);
      expect(res).to.deep.equal(expectedRes[index]);
      return testFunc(index + 1);
    };
    testFunc(0)();
  });
});
