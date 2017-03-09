npm run build && \
mkdir -p /usr/local/share/grafana/public/app/plugins/datasource/simplejson && \
cp -r dist/* /usr/local/share/grafana/public/app/plugins/datasource/simplejson \
&& brew services restart grafana
