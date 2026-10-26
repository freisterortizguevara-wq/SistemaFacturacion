# 1. Usamos la imagen oficial de .NET para compilar
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# 2. Copiamos el archivo del proyecto y restauramos dependencias
COPY *.csproj ./
RUN dotnet restore

# 3. Copiamos todo el código y lo compilamos en modo Release (optimizado)
COPY . ./
RUN dotnet publish -c Release -o out

# 4. Usamos una imagen más ligera solo para ejecutar
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

# 5. Le decimos a .NET que use el puerto 8080 (el que usa Render)
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# 6. Comando para arrancar la API
ENTRYPOINT ["dotnet", "Facturas.Api.dll"]