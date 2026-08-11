# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["backend/Importaciones.Api/Importaciones.Api.csproj", "backend/Importaciones.Api/"]
RUN dotnet restore "backend/Importaciones.Api/Importaciones.Api.csproj"
COPY . .
WORKDIR "/src/backend/Importaciones.Api"
RUN dotnet build "Importaciones.Api.csproj" -c Release -o /app/build
RUN dotnet publish "Importaciones.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Importaciones.Api.dll"]
