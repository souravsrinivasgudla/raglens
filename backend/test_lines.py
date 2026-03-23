def find_line_number(page_text: str, chunk_text: str) -> int:
    """Find the starting line number of a chunk within a page."""
    chunk_lines = [line.strip()
                   for line in chunk_text.split("\n") if line.strip()]
    if not chunk_lines:
        return 1

    first_chunk_line = chunk_lines[0]
    search_phrase = first_chunk_line[:40].lower()  # type: ignore

    lines = page_text.split("\n")
    for i, line in enumerate(lines, start=1):
        if search_phrase in line.lower():
            return i

    index = page_text.find(chunk_text[:100])  # type: ignore
    if index != -1:
        return page_text.count("\n", 0, index) + 1

    return 1


page_text = "ignored\nignored\nignored\nWe are looking for this sentence.\nIt spans multiple lines.\nAnd more."
chunk_text = "We are looking for this sentence.\nIt spans multiple lines."
print(find_line_number(page_text, chunk_text))
