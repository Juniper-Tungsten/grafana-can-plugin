# Introduction
Plugin to use CAN as a data source in Grafana
# Contrail configuration

## HTTPS access
For HTTPS access one needs to configure SSL in contrail.
Follow this [link](https://github.com/Juniper/contrail-controller/wiki/SSL-configuration-for-API,-neutron-server-and-openstack-keystone-in-Contrail) to configure SSL:  

## CORS setup
These links would be helpful for CORS setup in contrail:
- [openstack docs](https://docs.openstack.org/admin-guide/cross-project-cors.html)
- [3rd party resource](https://ianunruh.com/2014/11/openstack-cors.html)

# Installation
Copy the data source to /public/app/plugins/datasource/contrailanalytics. Then restart grafana-server. The new data source should now be available in the data source type dropdown in the Add Data Source View.

# Plugin Configuration
Explaination of various fields required during datasource addition in Grafana.
- `URL`: Enter the URL of contrail query server. Usually it is : `http://<hostname>:8081/`
- `Access`: `Direct` or via `proxy`
- Contrail API Auth
    - `Username`: Username used to access contrail
    - `Password`
    - `Tenant`
    - `Keystone URL`: URL of keystone server. Usually it is : `http://<hostname>:35357/v2.0/tokens/`

# Dev setup
This plugin requires node 6.10.0
```
npm install -g yarn
yarn install
npm run build
```

