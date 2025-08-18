import psycopg2
from psycopg2 import sql
from typing import List, Dict, Any, Optional
from dateutil.parser import parse


def infer_data_type(value: Any) -> str:
    """Infer PostgreSQL data type based on sample value."""
    if value is None:
        return 'text'  # Default to text when type cannot be inferred

    if isinstance(value, bool):
        return 'boolean'
    elif isinstance(value, int):
        return 'bigint'
    elif isinstance(value, float):
        return 'float8'
    elif isinstance(value, str):
        try:
            parse(value)
            return 'timestamp'
        except (ValueError, TypeError):
            return 'text'
    else:
        return 'text'


def create_table_from_samples(
        table_name: str,
        columns: List[str],
        column_comments: List[Optional[str]],
        sample_data: List[Dict[str, Any]],
        db_connection_params: Dict[str, Any],
        table_comment: Optional[str] = None
) -> None:
    """
    Create a PostgreSQL table based on sample data, including column comments.

    Args:
        table_name: Name of the table
        columns: List of column names
        column_comments: List of column comments, corresponding to columns
        sample_data: List of dictionaries with sample data (keys are column names)
        db_connection_params: Database connection parameters
        table_comment: Optional table comment
    """
    if not sample_data:
        raise ValueError("At least one row of sample data is required")

    if len(columns) != len(column_comments):
        raise ValueError("Length of columns and column_comments must match")

    # Infer data types for each column
    column_types = {}
    for col in columns:
        inferred_types = set()
        for row in sample_data:
            value = row.get(col)
            if value is not None:
                inferred_types.add(infer_data_type(value))

        # Determine final type
        if not inferred_types:
            final_type = 'text'  # Default to text if all values are NULL
        elif len(inferred_types) == 1:
            final_type = inferred_types.pop()
        else:
            # Handle mixed types, prioritizing more general types
            if 'text' in inferred_types:
                final_type = 'text'
            elif 'float8' in inferred_types and 'bigint' in inferred_types:
                final_type = 'float8'
            else:
                final_type = 'text'

        column_types[col] = final_type

    # Establish database connection and create table
    conn = None
    try:
        conn = psycopg2.connect(**db_connection_params)
        conn.autocommit = True
        cursor = conn.cursor()

        # Drop existing table
        drop_table_sql = sql.SQL("DROP TABLE IF EXISTS {}").format(
            sql.Identifier(table_name)
        )
        cursor.execute(drop_table_sql)

        # Create new table
        column_defs = [
            sql.SQL("{} {}").format(sql.Identifier(col), sql.SQL(column_types[col]))
            for col in columns
        ]
        create_table_sql = sql.SQL("CREATE TABLE {} ({})").format(
            sql.Identifier(table_name),
            sql.SQL(", ").join(column_defs)
        )
        cursor.execute(create_table_sql)

        # Add table comment
        if table_comment:
            comment_table_sql = sql.SQL("COMMENT ON TABLE {} IS {}").format(
                sql.Identifier(table_name),
                sql.Literal(table_comment)
            )
            cursor.execute(comment_table_sql)

        # Add column comments
        for col, comment in zip(columns, column_comments):
            if comment:
                comment_col_sql = sql.SQL("COMMENT ON COLUMN {}.{} IS {}").format(
                    sql.Identifier(table_name),
                    sql.Identifier(col),
                    sql.Literal(comment)
                )
                cursor.execute(comment_col_sql)

        # Print table creation details
        print(f"Table '{table_name}' created successfully with the following columns:")
        for col, comment in zip(columns, column_comments):
            print(f"- {col}: {column_types[col]} ({comment or 'No comment'})")
        if table_comment:
            print(f"Table comment: {table_comment}")

    except Exception as e:
        print(f"Error creating table: {e}")
        raise
    finally:
        if conn is not None:
            conn.close()


if __name__ == "__main__":
    # Database connection parameters
    db_params = {
        "dbname": "electronic",
        "user": "postgres",
        "password": "postgres",
        "host": "localhost",
        "port": "5432"
    }

    # Sample data
    table_name = "sample_table"
    columns = ["id", "name", "price", "created_at", "is_active"]
    column_comments = [
        "Primary key ID",
        "Product name",
        "Product price",
        "Creation timestamp",
        "Is active flag"
    ]
    table_comment = "Sample product table"

    sample_data = [
        {
            "id": 1,
            "name": "Product A",
            "price": 19.99,
            "created_at": "2023-01-01 10:00:00",
            "is_active": True
        },
        {
            "id": 2,
            "name": "Product B",
            "price": 29.99,
            "created_at": "2023-01-02 11:30:00",
            "is_active": False
        }
    ]

    # Create table
    create_table_from_samples(
        table_name=table_name,
        columns=columns,
        column_comments=column_comments,
        sample_data=sample_data,
        db_connection_params=db_params,
        table_comment=table_comment
    )