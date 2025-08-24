<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Test Upload Logo</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>

<body class="bg-gray-100 flex items-center justify-center min-h-screen">

    <div class="bg-white shadow rounded p-6 w-full max-w-md">
        <h1 class="text-2xl font-bold mb-4 text-center text-gray-800">Test Upload Logo</h1>

        @if(session('success'))
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {{ session('success') }}
        </div>
        @endif

        @if($errors->any())
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <ul class="list-disc pl-5">
                @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
        @endif

        <form method="POST" action="/upload-logo" enctype="multipart/form-data" class="space-y-4">
            @csrf
            <div>
                <label for="logo" class="block text-gray-700 mb-1">Pilih Logo:</label>
                <input type="file" name="logo" id="logo" class="border border-gray-300 rounded p-2 w-full">
            </div>
            <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Upload
            </button>
        </form>
    </div>

</body>

</html>