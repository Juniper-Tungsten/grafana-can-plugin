# Introduction
Plugin to use CAN as a data source in Grafana. 

# Pre-requisites
- Grafana: 3.x
- Contrail: 3.2+


# Installation
Note: Due to CORS restrictions you may run into issues. Refer [below](#cors-setup) for possible solutions.

**Not recommended**: If you want to simply test the plugin, you can run your browser with security disabled.

### Using grafana-cli
```bash
grafana-cli plugins install juniper-contrailanalytics-datasource
```
### Clone into plugins directory
```bash
cd /var/lib/grafana/plugins
git clone https://github.com/Juniper/grafana-can-plugin.git
sudo service grafana-server restart
```

# Plugin Configuration
Explaination of various fields required during datasource addition in Grafana.
- `URL`: Enter the URL of contrail query server. Usually it is : `http://<hostname>:8081/`
- `Access`: `Direct` or via `proxy`
- Contrail API Auth
    - `Username`: Username for accessing data in CAN
    - `Password`: Password for the username
    - `Tenant/Domain`
    - `Keystone URL`: URL of keystone server. Usually it is : `http://<hostname>:35357/v2.0/tokens/`

# Contrail configuration
In order to make communication secure you will need to configure your contrail
instance for HTTPS access and set appropriate CORS endpoints.

## HTTPS access
For HTTPS access one needs to configure SSL in contrail.
Follow [this link](https://github.com/Juniper/contrail-controller/wiki/SSL-configuration-for-API,-neutron-server-and-openstack-keystone-in-Contrail) to configure SSL.

## CORS setup

- Set up CORS policy on your keystone server.
- Use grafana's `proxy` option to reach contrail-api.

These links would be helpful for CORS setup in keystone:
- [Openstack docs](https://docs.openstack.org/liberty/config-reference/content/keystone-configuration-file.html)
- [3rd party resource](https://ianunruh.com/2014/11/openstack-cors.html)

### Some ways to bypass CORS
Please note that all the methods listed below are hacks and should not be used in production.

- Use `proxy` access while configuring data source in grafana. When this option is set, grafana server makes a request to contrail instead of your browser. But, there is a catch. If your `keystone-url` and `url` differ in [origin](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy), grafana would not relay the requests to `keystone-url` via the backend.
- Set up grafana to share the [origin](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) as your keystone. You can install grafana on the same host as keystone for this. Now use the `proxy` access feature of grafana to reach contrail-api server.
 
# Dev setup
This plugin requires node 6.10.0
```bash
npm install -g yarn
yarn install
npm run build
```

