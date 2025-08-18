import os

def find_excel_files(directory, extensions=('.xlsx', '.xls')):
    excel_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(extensions) and not file.lower().startswith('.'):
                excel_files.append(os.path.join(root, file))
    return excel_files



# 使用示例
if __name__ == "__main__":
    target_directory = "/Users/jiexu/Documents/数据-软件/客户数据/2025-06-30 本地知识库 电力行业 二期/数据库源"
    excel_files = find_excel_files(target_directory)

    print("\n找到的Excel文件:")
    for file_path in excel_files:
        print(file_path)

    print(f"\n共找到 {len(excel_files)} 个.xlsx文件")