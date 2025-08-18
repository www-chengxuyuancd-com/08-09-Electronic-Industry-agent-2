import pandas as pd
from typing import List, Dict, Any, Optional
from utils import to_pinyin_list  # Assuming this is a custom function for Pinyin conversion
from pathlib import Path
from config import file_and_database_mapping

def get_excel_info(file_path: str, head_index: int = 0) -> Optional[Dict[str, Any]]:
    """
    Read an Excel file and extract information including sheet count, headers, Pinyin headers, and sample data.

    Args:
        file_path: Path to the Excel file
        head_index: Row index (0-based) to use as headers (default: 0)

    Returns:
        Dictionary containing raw headers, Pinyin headers, and up to three rows of sample data,
        or None if an error occurs.
    """
    try:
        filename = Path(file_path).stem
        head_index = file_and_database_mapping[filename]["header_index"]
        # Read all sheets from the Excel file
        df_dict = pd.read_excel(file_path, sheet_name=None, engine='openpyxl')

        # Output sheet count
        sheet_count = len(df_dict)
        print(f"Excel file contains {sheet_count} sheet(s)")
        print("Sheet details:")

        # Initialize variables for headers and sample data
        raw_headers: List[str] = []
        headers_to_pinyin: List[str] = []
        sample_data: List[Dict[str, Any]] = []

        # Process the first sheet only
        for sheet_name, sheet_data in df_dict.items():
            row_count, col_count = sheet_data.shape
            print(f"  Sheet '{sheet_name}': {row_count} rows, {col_count} columns")

            # Check if head_index is valid (0-based indexing)
            if head_index < 0 or head_index >= row_count:
                print(f"    Warning: Sheet '{sheet_name}' does not have row {head_index}")
                continue

            # Get headers from the specified row (head_index is 0-based)
            header_row = sheet_data.iloc[head_index]
            headers = [str(val) if pd.notna(val) else f"Unnamed_{i}" for i, val in enumerate(header_row)]
            if len(headers) != col_count:
                print(f"    Warning: Header row has {len(headers)} elements, but DataFrame has {col_count} columns")
                headers = headers + [f"Unnamed_{i}" for i in range(len(headers), col_count)]  # Pad headers if needed

            # Debug: Print raw header row for inspection
            print(f"    Raw header row: {header_row.tolist()}")
            print(f"    Extracted headers: {headers}")

            raw_headers = headers
            headers_to_pinyin = to_pinyin_list(headers)

            # Extract up to three rows of data after the header row, skipping empty rows
            data_rows = sheet_data.iloc[head_index + 1:].dropna(how='all').head(3)
            if data_rows.empty:
                print(f"    Warning: No valid data rows found after row {head_index} in sheet '{sheet_name}'")
                continue

            # Convert rows to list of dictionaries
            for _, row in data_rows.iterrows():
                row_dict = {headers[i]: row[i] if pd.notna(row[i]) else None for i in range(len(headers))}
                # Only include rows with at least one non-None value
                if any(value is not None for value in row_dict.values()):
                    sample_data.append(row_dict)

            # Debug output: Show the sample data
            print(f"    Extracted sample data: {sample_data}")
            break  # Process only the first sheet

        if not raw_headers:
            print("Error: No valid headers found in any sheet")
            return None

        if not sample_data:
            print("Error: No valid sample data found after headers")
            return None

        return {
            "table_comment": filename,
            "table_name": file_and_database_mapping[filename]["table_name"],
            "raw_headers": raw_headers,
            "headers_to_pinyin": headers_to_pinyin,
            "sample_data": sample_data
        }

    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found")
        return None
    except Exception as e:
        print(f"Error processing Excel file: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    # Example file path
    file_path = "/Users/jiexu/Documents/数据-软件/客户数据/2025-06-30 本地知识库 电力行业 二期/数据库源/网管-OLT数据.xlsx"
    result = get_excel_info(file_path)
    if result:
        print("\nReturned data:")
        print(f"table name: {result['table_name']}")
        print(f"table_comment: {result['table_comment']}")
        print(f"Raw headers: {result['raw_headers']}")
        print(f"Pinyin headers: {result['headers_to_pinyin']}")
        print("Sample data:")
        for row in result['sample_data']:
            print(row)