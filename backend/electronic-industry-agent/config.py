
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

# Dataset presets for diff-upload API
# key -> display_name, target_table, unique_columns
DATASET_PRESETS = {
    "wangguan_onu": {
        "display_name": "网管ONU在线清单",
        "target_table": "wangguan_ONU_zaixianqingdan",
        "unique_columns": ["onu_ming_cheng"],
    },
    "ziguan_olt": {
        "display_name": "资管-OLT",
        "target_table": "ziguan_olt_data",
        "unique_columns": ["olt_ming_cheng"],
    },
    "ziguan_olt_duankou": {
        "display_name": "资管-OLT端口",
        "target_table": "ziguan_OLT_duankou",
        "unique_columns": ["duan_kou_rmuid"],
    },
    "ziguan_onu_guangmao": {
        "display_name": "资管-ONU光猫用户",
        "target_table": "ziguan_ONU_guangmao",
        "unique_columns": ["zi_yuan_wei_yi_biao_zhi"],
    },
    "ziguan_pon_wangluo": {
        "display_name": "资管-PON网络连接",
        "target_table": "ziguan_PON_wangluo",
        "unique_columns": [],
    },
    "ziguan_fenguangqi": {
        "display_name": "资管-分光器",
        "target_table": "ziguan_fenguangqi",
        "unique_columns": [],
    },
    "jiake_yewu_xinxi": {
        "display_name": "家客业务信息表",
        "target_table": "jiake_yewu_xinxi",
        "unique_columns": [],
    },
}