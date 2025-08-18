
file_and_database_mapping = {
    "网管-OLT数据" : {
        "table_name": "wangguan_olt_data",
        "header_index": 7
    },
    "网管-ONU数据" : {
        "table_name": "wangguan_onu_data",
        "header_index": 7
    },
    "网管-PON口数据" : {
        "table_name": "wangguan_pon_kou_data",
        "header_index": 7
    },
    "资管-OLT" : {
        "table_name": "ziguan_olt_data",
        "header_index": 0,
    },
    "资管-OLT端口" : {
        "table_name": "ziguan_olt_duankou_data",
        "header_index": 7
    },
    "资管-PON网络连接" : {
        "table_name": "ziguan_pon_wangluo_lianjie",
        "header_index": 7
    },
    "资管-分光器" : {
        "table_name": "ziguan_fenguangqi",
        "header_index": 7
    },
}

db_params = {
    "dbname": "electronic",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432"
}