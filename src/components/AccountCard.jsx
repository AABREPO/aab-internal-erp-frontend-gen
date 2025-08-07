import Highlighter from "react-highlight-words";

const getStatusClass = (status) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Inactive':
      return 'bg-red-100 text-red-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function AccountCard({ account, filter }) {
  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-bold">
          <Highlighter
            highlightClassName="bg-green-100"
            searchWords={[filter]}
            autoEscape={true}
            textToHighlight={account.name}
          />
        </h2>
        <span
          className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${getStatusClass(
            account.status
          )}`}
        >
          {account.status}
        </span>
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-600">
          <b>Owner:</b> <Highlighter
            highlightClassName="bg-green-100"
            searchWords={[filter]}
            autoEscape={true}
            textToHighlight={account.owner}
          />
        </p>
        <p className="text-sm text-gray-600">
          <b>Created:</b> <Highlighter
            highlightClassName="bg-green-100"
            searchWords={[filter]}
            autoEscape={true}
            textToHighlight={account.created}
          />
        </p>
        <p className="text-sm text-gray-600">
          <b>ID:</b> <Highlighter
            highlightClassName="bg-green-100"
            searchWords={[filter]}
            autoEscape={true}
            textToHighlight={account.id.toString()}
          />
        </p>
      </div>
    </div>
  );
}

