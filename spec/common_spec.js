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
    let testFunc = function (index) {
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

  it('[isAggregateField] should return false on non aggregate field', function (done) {
    let input = 'abc';
    let res = Common.isAggregateField(input);
    expect(res).to.be.false;
    done();
  });

  it('[isAggregateField] should return true on aggregate field', function (done) {
    let input = 'SUM(abc)';
    let res = Common.isAggregateField(input);
    expect(res).to.be.true;
    input = 'COUNT(abc)';
    res = Common.isAggregateField(input);
    expect(res).to.be.true;
    input = 'AVG(abc)';
    res = Common.isAggregateField(input);
    expect(res).to.be.true;
    input = 'MIN(abc)';
    res = Common.isAggregateField(input);
    expect(res).to.be.true;
    input = 'MAX(abc)';
    res = Common.isAggregateField(input);
    expect(res).to.be.true;
    input = 'PERCENTILES(abc)';
    res = Common.isAggregateField(input);
    expect(res).to.be.true;
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
    let testFunc = function (index) {
      if (index >= expectedRes.length) {
        return done;
      }
      let res = Common.transform(inputs[index]);
      expect(res).to.deep.equal(expectedRes[index]);
      return testFunc(index + 1);
    };
    testFunc(0)();
  });

  it('[processAnnotationResult] should return valid annotaion object', function (done) {
    let result = {status: 500};
    let options = {
      name: 'someName',
      enable: true,
      datasource: 'someDs',
      titleMapping: 'Source',
      textMapping: 'Xmlmessage',
      tagMapping: 'Level'
    };
    let res = Common.processAnnotationResult(result, options);
    let expectedRes = [];
    expect(res).to.deep.equal(expectedRes);
    result = {
      status: 200,
      data: {
        'UVEAlarms': {
          'alarms': [
            {
              'severity': 0,
              'timestamp': 1494526922339119,
              'ack': false,
              'token': 'eyJ0aW1lc3RhbXAiOiAxNDk0NTI2OTIyMzM5MTE5LCAiaHR0cF9wb3J0IjogNTk5NSwgImhvc3RfaXAiOiAiMTAuMjA5LjEuMTMifQ==',
              'type': 'default-global-system-config:system-defined-process-connectivity',
              'description': 'Process(es) reporting as non-functional.'
            },
            {
              'severity': 0,
              'timestamp': 1494526413491767,
              'ack': false,
              'token': 'eyJ0aW1lc3RhbXAiOiAxNDk0NTI2NDEzNDkxNzY3LCAiaHR0cF9wb3J0IjogNTk5NSwgImhvc3RfaXAiOiAiMTAuMjA5LjEuMTMifQ==',
              'type': 'default-global-system-config:system-defined-core-files',
              'description': 'A core file has been generated on the node.'
            }
          ]
        }
      }
    };
    options.alarm = true;
    options.alarmUVEName = 'someUVE';
    options.alarmNodeName = 'someNode';
    res = Common.processAnnotationResult(result, options);
    expectedRes = [{
      annotation:
      { name: 'someName',
        enabled: true,
        datasource: 'someDs'
      },
      title: 'someUVE\\someNode',
      time: 1494526922339.119,
      text: 'Process(es) reporting as non-functional.',
      tags:
      [ 'Severity: 0',
        'default-global-system-config:system-defined-process-connectivity' ]
    }, {
      annotation: {
        name: 'someName',
        enabled: true,
        datasource: 'someDs'
      },
      title: 'someUVE\\someNode',
      time: 1494526413491.767,
      text: 'A core file has been generated on the node.',
      tags:
      [ 'Severity: 0',
        'default-global-system-config:system-defined-core-files' ]
    }
    ];
    expect(res).to.deep.equal(expectedRes);
    result.data = {
      value: [{
        name: 'nodeName',
        value: result.data
      }, {
        name: 'nodeName2',
        value: result.data
      }
      ]
    };
    expectedRes = [ { annotation: { name: 'someName', enabled: true, datasource: 'someDs' },
      title: 'nodeName',
      time: 1494526922339.119,
      text: 'Process(es) reporting as non-functional.',
      tags:
      [ 'Severity: 0',
        'default-global-system-config:system-defined-process-connectivity' ] },
    { annotation: { name: 'someName', enabled: true, datasource: 'someDs' },
      title: 'nodeName',
      time: 1494526413491.767,
      text: 'A core file has been generated on the node.',
      tags:
      [ 'Severity: 0',
        'default-global-system-config:system-defined-core-files' ] },
    { annotation: { name: 'someName', enabled: true, datasource: 'someDs' },
      title: 'nodeName2',
      time: 1494526922339.119,
      text: 'Process(es) reporting as non-functional.',
      tags:
      [ 'Severity: 0',
        'default-global-system-config:system-defined-process-connectivity' ] },
    { annotation: { name: 'someName', enabled: true, datasource: 'someDs' },
      title: 'nodeName2',
      time: 1494526413491.767,
      text: 'A core file has been generated on the node.',
      tags:
      [ 'Severity: 0',
        'default-global-system-config:system-defined-core-files' ] } ];
    res = Common.processAnnotationResult(result, options);
    expect(res).to.deep.equal(expectedRes);
    options.alarm = false;
    result.data.value = [
      {
        'Category': '__default__',
        'Level': 6,
        'MessageTS': 1495035030607132,
        'Messagetype': 'discServiceLog',
        'ModuleId': 'contrail-discovery',
        'SequenceNum': 1511639,
        'Source': 'choc-esxi6-a-vm4',
        'Type': 1,
        'Xmlmessage': '<discServiceLog type=\'sandesh\'><log_msg type=\'string\' identifier=\'1\'>&lt;cl=choc-esxi6-a-vm4:contrail-topology,st=Collector&gt;  subs service=choc-esxi6-a-vm4, assign=2, count=2</log_msg></discServiceLog>'
      },
      {
        'Category': '__default__',
        'Level': 6,
        'MessageTS': 1495035031416257,
        'Messagetype': 'discServiceLog',
        'ModuleId': 'contrail-discovery',
        'SequenceNum': 1511640,
        'Source': 'choc-esxi6-a-vm4',
        'Type': 1,
        'Xmlmessage': '<discServiceLog type=\'sandesh\'><log_msg type=\'string\' identifier=\'1\'>&lt;cl=choc-esxi6-a-vm4:contrail-vrouter-nodemgr,st=Collector&gt; del sid choc-esxi6-a-vm4, policy=chash, expired=True</log_msg></discServiceLog>'
      },
      {
        'Category': '__default__',
        'Level': 6,
        'MessageTS': 1495035031418099,
        'Messagetype': 'discServiceLog',
        'ModuleId': 'contrail-discovery',
        'SequenceNum': 1511641,
        'Source': 'choc-esxi6-a-vm4',
        'Type': 1,
        'Xmlmessage': '<discServiceLog type=\'sandesh\'><log_msg type=\'string\' identifier=\'1\'>&lt;cl=choc-esxi6-a-vm4:contrail-vrouter-nodemgr,st=Collector&gt;  subs service=choc-esxi6-a-vm4, assign=2, count=2</log_msg></discServiceLog>'
      },
      {
        'Category': '__default__',
        'Level': 6,
        'MessageTS': 1495035031737203,
        'Messagetype': 'discServiceLog',
        'ModuleId': 'contrail-discovery',
        'SequenceNum': 1511642,
        'Source': 'choc-esxi6-a-vm4',
        'Type': 1,
        'Xmlmessage': '<discServiceLog type=\'sandesh\'><log_msg type=\'string\' identifier=\'1\'>&lt;cl=choc-esxi6-a-vm4:contrail-snmp-collector,st=ApiServer&gt;  assign service=choc-esxi6-a-vm4, info={\'port\': \'9100\', \'ip-address\': \'10.209.1.13\'}</log_msg></discServiceLog>'
      }
    ];
    expectedRes = [
      { annotation: { name: 'someName', enabled: true, datasource: 'someDs' },
        title: 'choc-esxi6-a-vm4',
        time: 1495035030607.132,
        text: '<discServiceLog type=\'sandesh\'><log_msg type=\'string\' identifier=\'1\'>&lt;cl=choc-esxi6-a-vm4:contrail-topology,st=Collector&gt;  subs service=choc-esxi6-a-vm4, assign=2, count=2</log_msg></discServiceLog>',
        tags: 6 },
      { annotation: { name: 'someName', enabled: true, datasource: 'someDs' },
        title: 'choc-esxi6-a-vm4',
        time: 1495035031416.257,
        text: '<discServiceLog type=\'sandesh\'><log_msg type=\'string\' identifier=\'1\'>&lt;cl=choc-esxi6-a-vm4:contrail-vrouter-nodemgr,st=Collector&gt; del sid choc-esxi6-a-vm4, policy=chash, expired=True</log_msg></discServiceLog>',
        tags: 6 },
      { annotation: { name: 'someName', enabled: true, datasource: 'someDs' },
        title: 'choc-esxi6-a-vm4',
        time: 1495035031418.099,
        text: '<discServiceLog type=\'sandesh\'><log_msg type=\'string\' identifier=\'1\'>&lt;cl=choc-esxi6-a-vm4:contrail-vrouter-nodemgr,st=Collector&gt;  subs service=choc-esxi6-a-vm4, assign=2, count=2</log_msg></discServiceLog>',
        tags: 6 },
      { annotation: { name: 'someName', enabled: true, datasource: 'someDs' },
        title: 'choc-esxi6-a-vm4',
        time: 1495035031737.203,
        text: '<discServiceLog type=\'sandesh\'><log_msg type=\'string\' identifier=\'1\'>&lt;cl=choc-esxi6-a-vm4:contrail-snmp-collector,st=ApiServer&gt;  assign service=choc-esxi6-a-vm4, info={\'port\': \'9100\', \'ip-address\': \'10.209.1.13\'}</log_msg></discServiceLog>',
        tags: 6 }
    ];
    res = Common.processAnnotationResult(result, options);
    expect(res).to.deep.equal(expectedRes);
    done();
  });
});
