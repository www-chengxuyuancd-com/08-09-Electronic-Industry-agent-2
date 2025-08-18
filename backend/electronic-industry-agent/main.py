from excel_tools import get_excel_info

from database_tools import create_table_from_samples

from config import db_params
from file_tools import find_excel_files

def create_single_table(file_path):
    print(file_path)
    dic = get_excel_info(file_path)
    if dic is None:
        print(f"Failed to process {file_path}, skipping...")
        return False
    
    try:
        create_table_from_samples(
            table_name=dic["table_name"],
            columns=dic["headers_to_pinyin"],
            column_comments=dic["raw_headers"],
            sample_data=dic["sample_data"],
            db_connection_params=db_params,
            table_comment=dic["table_comment"],
        )
        print(f"Successfully created table for {file_path}")
        return True
    except Exception as e:
        print(f"Error creating table for {file_path}: {str(e)}")
        return False

def create_table_for_files(directory):
    files = find_excel_files(directory)
    successful = 0
    failed = 0
    
    print(f"Found {len(files)} Excel files to process")
    
    for file in files:
        if create_single_table(file):
            successful += 1
        else:
            break
            failed += 1
    
    print(f"\nProcessing complete:")
    print(f"Successfully processed: {successful} files")
    print(f"Failed to process: {failed} files")

if __name__ == '__main__':
    # file_path = "/Users/jiexu/Documents/数据-软件/客户数据/2025-06-30 本地知识库 电力行业 二期/数据库源/网管-OLT数据.xlsx"
    # create_single_table(file_path)

    directory = "/Users/jiexu/Documents/数据-软件/客户数据/2025-06-30 本地知识库 电力行业 二期/数据库源"
    create_table_for_files(directory)