package com.kh.trip.util;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import net.coobird.thumbnailator.Thumbnails;

@Component
@Log4j2
@RequiredArgsConstructor
public class CustomFileUtil {

	private static final byte[] FALLBACK_IMAGE_BYTES = Base64.getDecoder().decode(
			"R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==");

	@Value("${com.kh.upload.path}")
	private String uploadPath;

	@PostConstruct
	// CustomFileUtil 객체로드되면서, init() 자동으로 실행
	public void init() {
		File tempFolder = new File(uploadPath);
		if (tempFolder.exists() == false) {
			tempFolder.mkdirs();
		}

		uploadPath = tempFolder.getAbsolutePath();
		log.info("tempFolder.getAbsolutePath() =" + uploadPath);
	}

	// 사용자가보내준 리스트파일들을 내장폴더에 중복되지않는 이름으로 변경해서 저장하고, 파일명을 리스트에 저장해서 리턴
	public List<String> saveFiles(List<MultipartFile> files) throws RuntimeException {
		// 절대중복되지않는 파일명을 만들어서 저장리스트
		List<String> uploadNames = new ArrayList<>();

		// size() == 0 대신 isEmpty() 권장
		if (files == null || files.isEmpty()) {
			uploadNames.add("default.jpg");
			return uploadNames;
		}

		for (MultipartFile multipartFile : files) {
			String savedName = UUID.randomUUID().toString() + "_" + multipartFile.getOriginalFilename();
			Path savePath = Paths.get(uploadPath, savedName);
			try {
				Files.copy(multipartFile.getInputStream(), savePath);
				// 파일의 타입 kdj.jpg => jpg 타입파일
				String contentType = multipartFile.getContentType();

				// 썸네일 생성
				// 타입을 체크하고, 진짜 이미지 파일인지 검토 (hwp. doc, ppt, txt) 필터링
				if (contentType != null && contentType.startsWith("image")) {
					// 썸네일파일명생성 : D:\ upload\s_sjfksdfjksdafjsak_kdj.jpg
					Path thumbnailPath = Paths.get(uploadPath, "s_" + savedName);
					// 원본파일을 가로폭(400),세로폭(400)변경을 해서 썸네일파일에 저장
					Thumbnails.of(savePath.toFile()).size(400, 400).toFile(thumbnailPath.toFile());
				}
				uploadNames.add(savedName);
			} catch (IOException e) {
				throw new RuntimeException("File save error: " + e.getMessage());
			}
		}
		return uploadNames;
	}

	// 사용자가보내준 리스트파일들을 내장폴더에 중복되지않는 이름으로 변경해서 저장하고, 파일명을 리스트에 저장해서 리턴
	public String saveFile(MultipartFile file) throws RuntimeException {
		// 절대중복되지않는 파일명을 만들어서 저장리스트
		String uploadName = null;

		// size() == 0 대신 isEmpty() 권장
		if (file == null || file.isEmpty()) {
			uploadName = "default.jpg";
			return uploadName;
		}

		MultipartFile multipartFile = file;
		String savedName = UUID.randomUUID().toString() + "_" + multipartFile.getOriginalFilename();
		Path savePath = Paths.get(uploadPath, savedName);
		try {
			Files.copy(multipartFile.getInputStream(), savePath);
			// 파일의 타입 kdj.jpg => jpg 타입파일
			String contentType = multipartFile.getContentType();

			// 썸네일 생성
			// 타입을 체크하고, 진짜 이미지 파일인지 검토 (hwp. doc, ppt, txt) 필터링
			if (contentType != null && contentType.startsWith("image")) {
				// 썸네일파일명생성 : D:\ upload\s_sjfksdfjksdafjsak_kdj.jpg
				Path thumbnailPath = Paths.get(uploadPath, "s_" + savedName);
				// 원본파일을 가로폭(400),세로폭(400)변경을 해서 썸네일파일에 저장
				Thumbnails.of(savePath.toFile()).size(400, 400).toFile(thumbnailPath.toFile());
			}
			uploadName = savedName;
		} catch (IOException e) {
			throw new RuntimeException("File save error: " + e.getMessage());
		}
		return uploadName;

	}

	// 브라우저에게 화며을 보여주는기능 담당함수
	public ResponseEntity<Resource> getFile(String fileName) {
		Path requestedPath = Paths.get(uploadPath, fileName);
		Path fallbackPath = Paths.get(uploadPath, "default.jpg");
		Path resolvedPath = Files.exists(requestedPath) ? requestedPath : (Files.exists(fallbackPath) ? fallbackPath : null);

		if (resolvedPath == null) {
			return ResponseEntity.ok()
					.contentType(MediaType.IMAGE_GIF)
					.contentLength(FALLBACK_IMAGE_BYTES.length)
					.header(HttpHeaders.CACHE_CONTROL, "public, max-age=300")
					.body(new ByteArrayResource(FALLBACK_IMAGE_BYTES));
		}

		Resource resource = new FileSystemResource(resolvedPath.toFile());
		return ResponseEntity.ok()
				.header(HttpHeaders.CACHE_CONTROL, "public, max-age=300")
				.header(HttpHeaders.CONTENT_TYPE, resolveContentType(resolvedPath))
				.body(resource);
	}

	private String resolveContentType(Path filePath) {
		try {
			String contentType = Files.probeContentType(filePath);
			if (contentType != null && !contentType.isBlank()) {
				return contentType;
			}
		} catch (IOException e) {
			log.warn("Failed to probe content type: {}", filePath, e);
		}

		String fileName = filePath.getFileName().toString().toLowerCase();
		if (fileName.endsWith(".png")) {
			return MediaType.IMAGE_PNG_VALUE;
		}
		if (fileName.endsWith(".gif")) {
			return MediaType.IMAGE_GIF_VALUE;
		}
		if (fileName.endsWith(".webp")) {
			return "image/webp";
		}
		return MediaType.IMAGE_JPEG_VALUE;
	}

	public void deleteFiles(List<String> fileNames) {
		if (fileNames == null || fileNames.isEmpty()) {
			return;
		}

		fileNames.forEach(fileName -> {
			// 썸네일이 있는지 확인하고 삭제
			String thumbnailFileName = "s_" + fileName;
			// 썸네일이미지경로
			Path thumbnailPath = Paths.get(uploadPath, thumbnailFileName);
			// 원본이미지경로
			Path filePath = Paths.get(uploadPath, fileName);
			try {
				Files.deleteIfExists(filePath);
				Files.deleteIfExists(thumbnailPath);
			} catch (IOException e) {
				throw new RuntimeException(e.getMessage());
			}
		});
	}

	public void deleteFile(String fileName) {
		if (fileName == null || fileName.isEmpty()) {
			return;
		}

		// 썸네일이 있는지 확인하고 삭제
		String thumbnailFileName = "s_" + fileName;
		// 썸네일이미지경로
		Path thumbnailPath = Paths.get(uploadPath, thumbnailFileName);
		// 원본이미지경로
		Path filePath = Paths.get(uploadPath, fileName);
		try {
			Files.deleteIfExists(filePath);
			Files.deleteIfExists(thumbnailPath);
		} catch (IOException e) {
			throw new RuntimeException(e.getMessage());
		};
	}
}
