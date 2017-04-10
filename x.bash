npm run build && \
mkdir -p /usr/local/share/grafana/public/app/plugins/datasource/contrailAnalytics && \
cp -r dist/* /usr/local/share/grafana/public/app/plugins/datasource/contrailAnalytics \
&& brew services restart grafana
