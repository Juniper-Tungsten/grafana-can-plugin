npm run build && \
mkdir -p /usr/local/share/grafana/public/app/plugins/datasource/contrailanalytics && \
cp -r dist/* /usr/local/share/grafana/public/app/plugins/datasource/contrailanalytics \
&& brew services restart grafana
